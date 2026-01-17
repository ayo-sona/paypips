import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Payment, PaymentStatus } from '../../database/entities/payment.entity';
import { Invoice, InvoiceStatus } from '../../database/entities/invoice.entity';
import {
  MemberSubscription,
  SubscriptionStatus,
} from '../../database/entities/member-subscription.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly webhookSecret: string | undefined;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,

    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,

    @InjectRepository(MemberSubscription)
    private memberSubscriptionRepository: Repository<MemberSubscription>,

    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {
    this.webhookSecret = this.configService.get('paystack.webhookSecret');
  }

  verifyPaystackSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', this.webhookSecret as string)
      .update(payload)
      .digest('hex');

    return hash === signature;
  }

  async handlePaystackWebhook(event: any) {
    this.logger.log(`Received Paystack webhook: ${event.event}`);

    try {
      switch (event.event) {
        case 'charge.success':
          await this.handleChargeSuccess(event.data);
          break;

        case 'charge.failed':
          await this.handleChargeFailed(event.data);
          break;

        case 'subscription.create':
          this.logger.log('Subscription created on Paystack');
          break;

        case 'subscription.not_renew':
          this.logger.log('Subscription will not renew');
          break;

        case 'subscription.disable':
          await this.handleSubscriptionDisable(event.data);
          break;

        case 'invoice.create':
          this.logger.log('Invoice created on Paystack');
          break;

        case 'invoice.update':
          this.logger.log('Invoice updated on Paystack');
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data);
          break;

        default:
          this.logger.warn(`Unhandled webhook event: ${event.event}`);
      }

      return { status: 'success', message: 'Webhook processed' };
    } catch (error) {
      this.logger.error(
        `Webhook processing error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async handleChargeSuccess(data: any) {
    this.logger.log(`Processing successful charge: ${data.reference}`);

    // Find payment by reference
    const payment = await this.paymentRepository.findOne({
      where: { provider_reference: data.reference },
      relations: ['invoices', 'invoices.member_subscription', 'users'],
    });

    if (!payment) {
      this.logger.warn(`Payment not found for reference: ${data.reference}`);
      return;
    }

    // Update payment status
    payment.status = PaymentStatus.SUCCESS;
    payment.metadata = {
      ...payment.metadata,
      webhook_data: data,
      paid_at: data.paid_at,
      channel: data.channel,
      card_details: {
        last4: data.authorization?.last4,
        bank: data.authorization?.bank,
        brand: data.authorization?.brand,
      },
    };

    await this.paymentRepository.save(payment);

    // Update invoice
    if (payment.invoice) {
      payment.invoice.status = InvoiceStatus.PAID;
      payment.invoice.paid_at = new Date(data.paid_at);
      await this.invoiceRepository.save(payment.invoice);

      // If invoice is linked to a subscription, ensure it's active
      if (payment.invoice.member_subscription) {
        const subscription = payment.invoice.member_subscription;

        if (
          subscription.status === SubscriptionStatus.EXPIRED ||
          subscription.status === SubscriptionStatus.PAUSED
        ) {
          subscription.status = SubscriptionStatus.ACTIVE;
          await this.memberSubscriptionRepository.save(subscription);
          this.logger.log(
            `Subscription ${subscription.id} reactivated after payment`,
          );
        }
      }
    }

    // Send notification
    if (payment.payer_user) {
      await this.notificationsService.sendPaymentSuccessNotification({
        email: payment.payer_user.email,
        phone: payment.payer_user.phone,
        memberName: `${payment.payer_user.first_name} ${payment.payer_user.last_name}`,
        amount: payment.amount,
        currency: payment.currency,
        reference: data.reference,
        paidAt: new Date(data.paid_at),
        channel: data.channel,
      });
    }

    this.logger.log(`Payment ${payment.id} marked as successful`);
  }

  private async handleChargeFailed(data: any) {
    this.logger.log(`Processing failed charge: ${data.reference}`);

    const payment = await this.paymentRepository.findOne({
      where: { provider_reference: data.reference },
      relations: ['invoices', 'users'],
    });

    if (!payment) {
      this.logger.warn(`Payment not found for reference: ${data.reference}`);
      return;
    }

    // Update payment status
    payment.status = PaymentStatus.FAILED;
    payment.metadata = {
      ...payment.metadata,
      webhook_data: data,
      failure_reason: data.gateway_response,
      failed_at: new Date().toISOString(),
    };

    await this.paymentRepository.save(payment);

    // Update invoice status
    if (payment.invoice && payment.invoice.status === InvoiceStatus.PENDING) {
      payment.invoice.status = InvoiceStatus.FAILED;
      await this.invoiceRepository.save(payment.invoice);
    }

    // Send notification
    if (payment.payer_user && payment.invoice) {
      const frontendUrl = this.configService.get('frontend.url');
      await this.notificationsService.sendPaymentFailedNotification({
        email: payment.payer_user.email,
        phone: payment.payer_user.phone,
        memberName: `${payment.payer_user.first_name} ${payment.payer_user.last_name}`,
        amount: payment.amount,
        currency: payment.currency,
        failureReason: data.gateway_response || 'Payment declined',
        invoiceNumber: payment.invoice.invoice_number,
        paymentUrl: `${frontendUrl}/invoices/${payment.invoice.id}/pay`,
      });
    }

    this.logger.log(`Payment ${payment.id} marked as failed`);
  }

  private async handleSubscriptionDisable(data: any) {
    this.logger.log(
      `Processing subscription disable: ${data.subscription_code}`,
    );

    // You can add logic here to disable subscriptions if you're using
    // Paystack's native subscription feature
    // For now, we're managing subscriptions ourselves
  }

  private async handleInvoicePaymentFailed(data: any) {
    this.logger.log(`Invoice payment failed: ${data.invoice_code}`);

    // Handle failed recurring payments for Paystack's native invoice feature
    // You can implement retry logic or notification here
  }
}
