import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Invoice } from '../../database/entities/invoice.entity';
import { Member } from '../../database/entities/member.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { generateInvoiceNumber } from '../../common/utils/invoice-number.util';
import { MemberSubscription } from '../../database/entities/member-subscription.entity';
import { InvoiceStatus } from '../../database/entities/invoice.entity';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,

    @InjectRepository(Member)
    private memberRepository: Repository<Member>,

    @InjectRepository(MemberSubscription)
    private memberSubscriptionRepository: Repository<MemberSubscription>,
  ) {}

  async createMemberInvoice(
    organizationId: string,
    createInvoiceDto: CreateInvoiceDto,
  ) {
    // Verify member
    const member = await this.memberRepository.findOne({
      where: {
        id: createInvoiceDto.billedUserId,
        organization_user: {
          organization_id: organizationId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Verify subscription if provided
    if (createInvoiceDto.subscriptionId) {
      const subscription = await this.memberSubscriptionRepository.findOne({
        where: {
          id: createInvoiceDto.subscriptionId,
          organization_id: organizationId,
        },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }
    }

    // Create invoice
    const invoice = this.invoiceRepository.create({
      issuer_org_id: organizationId,
      billed_user_id: createInvoiceDto.billedUserId,
      member_subscription_id: createInvoiceDto.subscriptionId,
      invoice_number: generateInvoiceNumber(organizationId),
      amount: createInvoiceDto.amount,
      currency: createInvoiceDto.currency || 'NGN',
      status: InvoiceStatus.PENDING,
      due_date: createInvoiceDto.dueDate,
      metadata: createInvoiceDto.metadata || {},
    });

    const saved = await this.invoiceRepository.save(invoice);

    return {
      message: 'Member invoice created successfully',
      data: saved,
    };
  }

  async findAllMemberInvoices(
    organizationId: string,
    paginationDto: PaginationDto,
    status?: string,
  ) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const whereCondition: any = { issuer_org_id: organizationId };
    if (status) {
      whereCondition.status = status;
    }

    const [invoices, total] = await this.invoiceRepository.findAndCount({
      where: whereCondition,
      relations: ['users', 'member_subscriptions', 'payments'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      message: 'All member invoices retrieved successfully',
      ...paginate(invoices, total, page, limit),
    };
  }

  async findMemberInvoice(organizationId: string, invoiceId: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: {
        id: invoiceId,
        issuer_org_id: organizationId,
      },
      relations: ['users', 'member_subscriptions', 'payments'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return {
      message: 'Member invoice retrieved successfully',
      data: invoice,
    };
  }

  async getMemberSubscriptionInvoices(
    organizationId: string,
    subscriptionId: string,
    paginationDto: PaginationDto,
  ) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [invoices, total] = await this.invoiceRepository.findAndCount({
      where: {
        issuer_org_id: organizationId,
        member_subscription_id: subscriptionId,
      },
      relations: ['member_subscriptions', 'payments'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      message: 'Member subscription invoices retrieved successfully',
      ...paginate(invoices, total, page, limit),
    };
  }

  async getOverdueMemberInvoices(organizationId: string) {
    const now = new Date();

    const invoices = await this.invoiceRepository.find({
      where: {
        issuer_org_id: organizationId,
        status: In(['pending', 'overdue']),
        due_date: LessThan(now),
      },
      relations: ['users'],
      order: { due_date: 'ASC' },
    });

    return {
      message: 'Overdue member invoices retrieved successfully',
      data: invoices,
      count: invoices.length,
    };
  }

  async markMemberInvoiceAsPaid(organizationId: string, invoiceId: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: {
        id: invoiceId,
        issuer_org_id: organizationId,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice already paid');
    }

    invoice.status = InvoiceStatus.PAID;
    invoice.paid_at = new Date();
    await this.invoiceRepository.save(invoice);

    return {
      message: 'Member invoice marked as paid',
      data: invoice,
    };
  }

  async cancelMemberInvoice(organizationId: string, invoiceId: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: {
        id: invoiceId,
        issuer_org_id: organizationId,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot cancel paid invoice');
    }

    invoice.status = InvoiceStatus.CANCELLED;
    await this.invoiceRepository.save(invoice);

    return {
      message: 'Member invoice canceled successfully',
      data: invoice,
    };
  }

  async getMembersInvoiceStats(organizationId: string) {
    const [
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenue,
    ] = await Promise.all([
      this.invoiceRepository.count({
        where: { issuer_org_id: organizationId },
      }),
      this.invoiceRepository.count({
        where: { issuer_org_id: organizationId, status: InvoiceStatus.PAID },
      }),
      this.invoiceRepository.count({
        where: { issuer_org_id: organizationId, status: InvoiceStatus.PENDING },
      }),
      this.invoiceRepository.count({
        where: {
          issuer_org_id: organizationId,
          status: In([InvoiceStatus.PENDING, InvoiceStatus.FAILED]),
          due_date: LessThan(new Date()),
        },
      }),
      this.invoiceRepository.query(
        `SELECT COALESCE(SUM(amount), 0) as total
           FROM invoices
           WHERE issuer_org_id = $1 AND status = $2`,
        [organizationId, InvoiceStatus.PAID],
      ),
    ]);

    return {
      message: 'Member invoice stats retrieved successfully',
      data: {
        total_invoices: totalInvoices,
        paid_invoices: paidInvoices,
        pending_invoices: pendingInvoices,
        overdue_invoices: overdueInvoices,
        cancelled_invoices:
          totalInvoices - paidInvoices - pendingInvoices - overdueInvoices,
        total_revenue: parseFloat(totalRevenue[0].total),
      },
    };
  }
}
