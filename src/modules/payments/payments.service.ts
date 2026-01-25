import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  Payment,
  PaymentProvider,
  PaymentStatus,
} from '../../database/entities/payment.entity';
import { Invoice, InvoiceStatus } from '../../database/entities/invoice.entity';
import { Member } from '../../database/entities/member.entity';
import { PaystackService } from './paystack.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,

    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,

    @InjectRepository(Member)
    private memberRepository: Repository<Member>,

    private paystackService: PaystackService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {}

  async initializePayment(
    organizationId: string,
    initializePaymentDto: InitializePaymentDto,
  ) {
    // Get invoice
    const invoice = await this.invoiceRepository.findOne({
      where: {
        id: initializePaymentDto.invoiceId,
        issuer_org_id: organizationId,
      },
      relations: ['users'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === 'paid') {
      throw new BadRequestException('Invoice already paid');
    }

    // Generate unique payment reference
    const reference = `REE-${Date.now()}-${invoice.id.substring(0, 8)}`;

    // Create payment record
    const payment = this.paymentRepository.create({
      payer_org_id: organizationId,
      invoice_id: invoice.id,
      payer_user_id: invoice.billed_user_id,
      amount: invoice.amount,
      currency: invoice.currency,
      provider: PaymentProvider.PAYSTACK,
      provider_reference: reference,
      status: PaymentStatus.PENDING,
      metadata: {
        ...initializePaymentDto.metadata,
        invoice_number: invoice.invoice_number,
      },
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Initialize Paystack transaction
    const amountInKobo = this.paystackService.convertToKobo(invoice.amount);
    const callbackUrl = `${this.configService.get('frontend.url')}/dashboard`;

    const paystackResponse = await this.paystackService.initializeTransaction(
      invoice.billed_user.email,
      amountInKobo,
      reference,
      {
        payment_id: savedPayment.id,
        invoice_id: invoice.id,
        payer_name: `${invoice.billed_user.first_name} ${invoice.billed_user.last_name}`,
        ...initializePaymentDto.metadata,
      },
      callbackUrl,
    );

    if (!paystackResponse.status) {
      throw new BadRequestException(
        'Failed to initialize payment with Paystack',
      );
    }

    return {
      message: 'Payment initialized successfully',
      data: {
        payment_id: savedPayment.id,
        authorization_url: paystackResponse.data.authorization_url,
        access_code: paystackResponse.data.access_code,
        reference: paystackResponse.data.reference,
        amount: invoice.amount,
        currency: invoice.currency,
      },
    };
  }

  async verifyPayment(organizationId: string, reference: string) {
    // Find payment by reference
    const payment = await this.paymentRepository.findOne({
      where: {
        provider_reference: reference,
        payer_org_id: organizationId,
      },
      relations: ['invoice', 'payer_user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Verify with Paystack
    const verificationResponse =
      await this.paystackService.verifyTransaction(reference);

    if (!verificationResponse.status) {
      throw new BadRequestException('Payment verification failed');
    }

    const { data } = verificationResponse;

    // Update payment status
    if (data.status === 'success') {
      payment.status = PaymentStatus.SUCCESS;
      payment.metadata = {
        ...payment.metadata,
        paystack_response: data,
        verified_at: new Date().toISOString(),
      };

      // Update invoice status
      if (payment.invoice) {
        payment.invoice.status = InvoiceStatus.PAID;
        payment.invoice.paid_at = new Date();
        await this.invoiceRepository.save(payment.invoice);
      }
    } else {
      payment.status = PaymentStatus.FAILED;
      payment.metadata = {
        ...payment.metadata,
        paystack_response: data,
        failure_reason: data.gateway_response,
      };
    }

    await this.paymentRepository.save(payment);

    return {
      message:
        payment.status === PaymentStatus.SUCCESS
          ? 'Payment verified successfully'
          : 'Payment failed',
      data: {
        payment_id: payment.id,
        status: payment.status,
        amount: this.paystackService.convertToNaira(data.amount),
        reference: data.reference,
        paid_at: data.paid_at,
        channel: data.channel,
        gateway_response: data.gateway_response,
      },
    };
  }

  async findAll(
    organizationId: string,
    paginationDto: PaginationDto,
    status?: string,
  ) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const whereCondition: any = { payer_org_id: organizationId };
    if (status) {
      whereCondition.status = status;
    }

    const [payments, total] = await this.paymentRepository.findAndCount({
      where: whereCondition,
      relations: ['payer_user', 'invoice'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      message: 'Payments retrieved successfully',
      ...paginate(payments, total, page, limit),
    };
  }

  async findOne(organizationId: string, paymentId: string) {
    const payment = await this.paymentRepository.findOne({
      where: {
        id: paymentId,
        payer_org_id: organizationId,
      },
      relations: ['payer_user', 'invoice'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return {
      message: 'Payment retrieved successfully',
      data: payment,
    };
  }

  async getPaymentsByMember(
    organizationId: string,
    userId: string,
    paginationDto: PaginationDto,
  ) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [payments, total] = await this.paymentRepository.findAndCount({
      where: {
        payer_org_id: organizationId,
        payer_user_id: userId,
      },
      relations: ['invoice'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      message: 'Member payments retrieved successfully',
      ...paginate(payments, total, page, limit),
    };
  }

  async getMemberPaymentStats(organizationId: string) {
    const [totalPayments, successfulPayments, failedPayments, totalRevenue] =
      await Promise.all([
        this.paymentRepository.count({
          where: { payer_org_id: organizationId },
        }),
        this.paymentRepository.count({
          where: {
            payer_org_id: organizationId,
            status: PaymentStatus.SUCCESS,
          },
        }),
        this.paymentRepository.count({
          where: { payer_org_id: organizationId, status: PaymentStatus.FAILED },
        }),
        this.paymentRepository.query(
          `SELECT COALESCE(SUM(amount), 0) as total
           FROM payments
           WHERE payer_org_id = $1 AND status = $2`,
          [organizationId, PaymentStatus.SUCCESS],
        ),
      ]);

    return {
      message: 'Payment stats retrieved successfully',
      data: {
        total_payments: totalPayments,
        successful_payments: successfulPayments,
        failed_payments: failedPayments,
        pending_payments: totalPayments - successfulPayments - failedPayments,
        total_revenue: parseFloat(totalRevenue[0].total),
        success_rate:
          totalPayments > 0
            ? ((successfulPayments / totalPayments) * 100).toFixed(2)
            : 0,
      },
    };
  }
}
