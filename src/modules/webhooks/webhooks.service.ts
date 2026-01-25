import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
} from '@nestjs/common';
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
import Stripe from 'stripe';
import { PlanInterval } from 'src/database/entities/member-plan.entity';
import { OrganizationSubscription } from 'src/database/entities';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly paystackWebhookSecret: string | undefined;
  private readonly stripeWebhookSecret: string | undefined;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,

    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,

    @InjectRepository(OrganizationSubscription)
    private organizationSubscriptionRepository: Repository<OrganizationSubscription>,

    @InjectRepository(MemberSubscription)
    private memberSubscriptionRepository: Repository<MemberSubscription>,

    private configService: ConfigService,
    private notificationsService: NotificationsService,
    @Inject('STRIPE') private readonly stripe: Stripe,
  ) {
    this.paystackWebhookSecret = this.configService.get(
      'paystack.testSecretKey',
    );
    this.stripeWebhookSecret = this.configService.get('stripe.webhookSecret');
  }

  verifyPaystackSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', this.paystackWebhookSecret as string)
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

        // case 'subscription.create':
        //   this.logger.log('Subscription created on Paystack');
        //   break;

        // case 'subscription.not_renew':
        //   this.logger.log('Subscription will not renew');
        //   break;

        // case 'subscription.disable':
        //   await this.handleSubscriptionDisable(event.data);
        //   break;

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

        if (subscription.status === SubscriptionStatus.EXPIRED) {
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

  private async handleInvoicePaymentFailed(data: any) {
    this.logger.log(`Invoice payment failed: ${data.invoice_code}`);

    // Handle failed recurring payments for Paystack's native invoice feature
    // You can implement retry logic or notification here
  }

  //////////////////////////////////////////
  // Stripe

  async handleStripeWebhook(signature: string, payload: Buffer) {
    // const webhookSecret = this.configService.get<string>(
    //   'stripe.webhookSecret',
    // );
    const webhookSecret = this.stripeWebhookSecret;

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret as string,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed`);
    }

    this.logger.log(`Processing Stripe webhook: ${event.type}`);

    // Handle different event types
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentIntentCanceled(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        case 'payment_intent.requires_action':
          await this.handlePaymentIntentRequiresAction(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        // Charge Events (for refunds and disputes)
        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;

        case 'charge.dispute.created':
          await this.handleDisputeCreated(event.data.object);
          break;

        case 'charge.dispute.updated':
          await this.handleDisputeUpdated(event.data.object as Stripe.Dispute);
          break;

        case 'charge.dispute.closed':
          await this.handleDisputeClosed(event.data.object as Stripe.Dispute);
          break;

        // Payment Method Events
        case 'payment_method.attached':
          await this.handlePaymentMethodAttached(
            event.data.object as Stripe.PaymentMethod,
          );
          break;

        case 'payment_method.detached':
          await this.handlePaymentMethodDetached(
            event.data.object as Stripe.PaymentMethod,
          );
          break;

        case 'payment_method.updated':
          await this.handlePaymentMethodUpdated(
            event.data.object as Stripe.PaymentMethod,
          );
          break;

        // Customer Events
        case 'customer.updated':
          await this.handleCustomerUpdated(
            event.data.object as Stripe.Customer,
          );
          break;

        case 'customer.deleted':
          await this.handleCustomerDeleted(
            event.data.object as Stripe.Customer,
          );
          break;

        // case 'invoice.payment_succeeded':
        //   await this.handleInvoicePaymentSucceeded(
        //     event.data.object as Stripe.Invoice,
        //   );
        //   break;

        case 'invoice.payment_failed':
          await this.handleStripeInvoicePaymentFailed(
            event.data.object as Stripe.Invoice,
          );
          break;

        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(
            event.data.object as Stripe.Checkout.Session,
          );
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      return { received: true };
    } catch (error) {
      this.logger.error(
        `Error processing webhook ${event.type}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  //   // Record successful payment
  //   if (invoice.subscription) {
  //     const subscription = await this.subscriptionRepository.findOne({
  //       where: { stripe_subscription_id: invoice.subscription as string },
  //     });

  //     if (subscription) {
  //       await this.paymentRepository.save({
  //         organization_id: subscription.organization_id,
  //         stripe_payment_intent_id: invoice.payment_intent as string,
  //         amount: invoice.amount_paid / 100,
  //         currency: invoice.currency,
  //         status: 'succeeded',
  //         description: invoice.description || 'Subscription payment',
  //         metadata: { invoice_id: invoice.id },
  //       });
  //     }
  //   }
  // }

  private async handleStripeInvoicePaymentFailed(invoice: Stripe.Invoice) {
    // Handle failed payment - send notification, etc.
    console.error('Payment failed for invoice:', invoice.id);
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const organizationId = session.metadata?.organization_id;
    if (organizationId && session.subscription) {
      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        session.subscription as string,
      );
      // await this.saveSubscription(organizationId, stripeSubscription);
    }
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);

    // Find payment in database
    const payment = await this.paymentRepository.findOne({
      where: { provider_reference: paymentIntent.id },
      relations: [
        'invoice',
        'invoice.member_subscription',
        'invoice.organization_subscription',
        'payer_user',
      ],
    });

    if (!payment) {
      this.logger.warn(
        `Payment not found for PaymentIntent: ${paymentIntent.id}`,
      );
      return;
    }

    // Update payment status
    payment.status = PaymentStatus.SUCCESS;
    payment.metadata = {
      ...payment.metadata,
      stripe_charge_id: paymentIntent.latest_charge,
      paid_at: new Date(paymentIntent.created * 1000).toISOString(),
      payment_method: paymentIntent.payment_method,
      receipt_url: (paymentIntent as any).charges?.data[0]?.receipt_url,
    };

    await this.paymentRepository.save(payment);

    // Update invoice
    if (payment.invoice) {
      payment.invoice.status = InvoiceStatus.PAID;
      payment.invoice.paid_at = new Date();
      payment.invoice.provider_reference = paymentIntent.id;
      await this.invoiceRepository.save(payment.invoice);

      // Handle subscription renewal if invoice is linked to subscription
      await this.handleSubscriptionRenewal(payment.invoice);
    }

    // Send success notification
    if (payment.payer_user) {
      await this.notificationsService.sendPaymentSuccessNotification({
        email: payment.payer_user.email,
        phone: payment.payer_user.phone,
        memberName: `${payment.payer_user.first_name} ${payment.payer_user.last_name}`,
        amount: payment.amount,
        currency: payment.currency,
        reference: paymentIntent.id,
        paidAt: new Date(),
        channel: 'stripe',
      });
    }

    this.logger.log(`Payment ${payment.id} marked as successful`);
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    this.logger.warn(`Payment failed: ${paymentIntent.id}`);

    const payment = await this.paymentRepository.findOne({
      where: { provider_reference: paymentIntent.id },
      relations: ['invoice', 'payer_user'],
    });

    if (!payment) {
      this.logger.warn(
        `Payment not found for PaymentIntent: ${paymentIntent.id}`,
      );
      return;
    }

    // Update payment status
    payment.status = PaymentStatus.FAILED;
    payment.metadata = {
      ...payment.metadata,
      failure_reason:
        paymentIntent.last_payment_error?.message || 'Payment failed',
      failure_code: paymentIntent.last_payment_error?.code,
      failed_at: new Date().toISOString(),
    };

    await this.paymentRepository.save(payment);

    // Update invoice status
    if (payment.invoice && payment.invoice.status === InvoiceStatus.PENDING) {
      payment.invoice.status = InvoiceStatus.FAILED;
      await this.invoiceRepository.save(payment.invoice);
    }

    // Send failure notification
    if (payment.payer_user && payment.invoice) {
      await this.notificationsService.sendPaymentFailedNotification({
        email: payment.payer_user.email,
        phone: payment.payer_user.phone,
        memberName: `${payment.payer_user.first_name} ${payment.payer_user.last_name}`,
        amount: payment.amount,
        currency: payment.currency,
        failureReason:
          paymentIntent.last_payment_error?.message || 'Payment declined',
        invoiceNumber: payment.invoice.invoice_number,
        paymentUrl: `${process.env.FRONTEND_URL}/invoices/${payment.invoice.id}/pay`,
      });
    }

    this.logger.log(`Payment ${payment.id} marked as failed`);
  }

  private async handlePaymentIntentCanceled(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    this.logger.log(`Payment canceled: ${paymentIntent.id}`);

    const payment = await this.paymentRepository.findOne({
      where: { provider_reference: paymentIntent.id },
    });

    if (payment) {
      payment.status = PaymentStatus.FAILED;
      payment.metadata = {
        ...payment.metadata,
        canceled: true,
        canceled_at: new Date().toISOString(),
      };
      await this.paymentRepository.save(payment);
    }
  }

  private async handlePaymentIntentRequiresAction(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    this.logger.log(`Payment requires action (3D Secure): ${paymentIntent.id}`);

    const payment = await this.paymentRepository.findOne({
      where: { provider_reference: paymentIntent.id },
      relations: ['payer_user'],
    });

    if (payment && payment.payer_user) {
      // Send notification to complete 3D Secure
      // You can implement this in your notifications service
      this.logger.log(
        `Payment ${payment.id} requires 3D Secure authentication`,
      );
    }
  }

  // ==========================================
  // CHARGE & REFUND HANDLERS
  // ==========================================

  private async handleChargeRefunded(charge: Stripe.Charge) {
    this.logger.log(`Charge refunded: ${charge.id}`);

    // Find payment by charge ID
    const payment = await this.paymentRepository.findOne({
      where: { provider_reference: charge.payment_intent as string },
      relations: ['invoice', 'payer_user'],
    });

    if (!payment) {
      this.logger.warn(`Payment not found for charge: ${charge.id}`);
      return;
    }

    // Update payment status
    payment.status = PaymentStatus.REFUNDED;
    payment.metadata = {
      ...payment.metadata,
      refund: {
        id: charge.refunds?.data[0]?.id,
        amount: charge.amount_refunded / 100,
        reason: charge.refunds?.data[0]?.reason,
        created: new Date().toISOString(),
      },
    };

    await this.paymentRepository.save(payment);

    // Update invoice if fully refunded
    if (payment.invoice && charge.amount_refunded === charge.amount) {
      payment.invoice.status = InvoiceStatus.REFUNDED;
      await this.invoiceRepository.save(payment.invoice);
    }

    // Send refund notification
    if (payment.payer_user) {
      // Implement refund notification in notifications service
      this.logger.log(`Refund notification sent for payment ${payment.id}`);
    }
  }

  // ==========================================
  // DISPUTE HANDLERS
  // ==========================================

  private async handleDisputeCreated(dispute: Stripe.Dispute) {
    this.logger.warn(
      `Dispute created: ${dispute.id} for charge ${dispute.charge}`,
    );

    // Find payment
    const payment = await this.paymentRepository.findOne({
      where: {
        metadata: {
          stripe_charge_id: dispute.charge as string,
        },
      },
      relations: ['payer_user'],
    });

    if (payment) {
      payment.metadata = {
        ...payment.metadata,
        dispute: {
          id: dispute.id,
          amount: dispute.amount / 100,
          reason: dispute.reason,
          status: dispute.status,
          created: new Date(dispute.created * 1000).toISOString(),
        },
      };
      await this.paymentRepository.save(payment);
    }

    // Send alert to admin/support team
    this.logger.warn(
      `DISPUTE ALERT: ${dispute.reason} - Amount: ${dispute.amount / 100}`,
    );
    // TODO: Send email/SMS to support team
  }

  private async handleDisputeUpdated(dispute: Stripe.Dispute) {
    this.logger.log(`Dispute updated: ${dispute.id}`);

    const payment = await this.paymentRepository.findOne({
      where: {
        metadata: {
          stripe_charge_id: dispute.charge as string,
        },
      },
    });

    if (payment) {
      payment.metadata = {
        ...payment.metadata,
        dispute: {
          ...payment.metadata.dispute,
          status: dispute.status,
          updated: new Date().toISOString(),
        },
      };
      await this.paymentRepository.save(payment);
    }
  }

  private async handleDisputeClosed(dispute: Stripe.Dispute) {
    this.logger.log(
      `Dispute closed: ${dispute.id} - Status: ${dispute.status}`,
    );

    const payment = await this.paymentRepository.findOne({
      where: {
        metadata: {
          stripe_charge_id: dispute.charge as string,
        },
      },
    });

    if (payment) {
      // If dispute lost, mark payment as disputed/refunded
      if (dispute.status === 'lost') {
        payment.status = PaymentStatus.REFUNDED;
      }

      payment.metadata = {
        ...payment.metadata,
        dispute: {
          ...payment.metadata.dispute,
          status: dispute.status,
          closed: new Date().toISOString(),
        },
      };
      await this.paymentRepository.save(payment);
    }
  }

  // ==========================================
  // PAYMENT METHOD HANDLERS
  // ==========================================

  private async handlePaymentMethodAttached(
    paymentMethod: Stripe.PaymentMethod,
  ) {
    this.logger.log(`Payment method attached: ${paymentMethod.id}`);
    // Track payment method additions if needed
  }

  private async handlePaymentMethodDetached(
    paymentMethod: Stripe.PaymentMethod,
  ) {
    this.logger.log(`Payment method detached: ${paymentMethod.id}`);
    // Track payment method removals if needed
  }

  private async handlePaymentMethodUpdated(
    paymentMethod: Stripe.PaymentMethod,
  ) {
    this.logger.log(`Payment method updated: ${paymentMethod.id}`);
    // Handle payment method updates (e.g., card expiry updated)
  }

  // ==========================================
  // CUSTOMER HANDLERS
  // ==========================================

  private async handleCustomerUpdated(customer: Stripe.Customer) {
    this.logger.log(`Customer updated: ${customer.id}`);
    // Sync customer data with your database if needed
  }

  private async handleCustomerDeleted(customer: Stripe.Customer) {
    this.logger.log(`Customer deleted: ${customer.id}`);
    // Handle customer deletion if needed
  }

  // ==========================================
  // SUBSCRIPTION RENEWAL HELPER
  // ==========================================

  private async handleSubscriptionRenewal(invoice: Invoice) {
    // Handle member subscription renewal
    if (invoice.member_subscription_id) {
      const subscription = await this.memberSubscriptionRepository.findOne({
        where: { id: invoice.member_subscription_id },
        relations: ['plan'],
      });

      if (subscription) {
        // Reactivate if expired/paused
        if (subscription.status === SubscriptionStatus.EXPIRED) {
          subscription.status = SubscriptionStatus.ACTIVE;

          // Extend subscription period
          const now = new Date();
          const plan = subscription.plan;

          if (plan.interval === PlanInterval.MONTHLY) {
            subscription.expires_at = new Date(
              now.setMonth(now.getMonth() + plan.interval_count),
            );
          } else if (plan.interval === PlanInterval.YEARLY) {
            subscription.expires_at = new Date(
              now.setFullYear(now.getFullYear() + plan.interval_count),
            );
          }

          await this.memberSubscriptionRepository.save(subscription);
          this.logger.log(`Member subscription ${subscription.id} renewed`);
        }
      }
    }

    // Handle organization subscription renewal
    if (invoice.organization_subscription_id) {
      const subscription =
        await this.organizationSubscriptionRepository.findOne({
          where: { id: invoice.organization_subscription_id },
          relations: ['plan'],
        });

      if (subscription) {
        subscription.status = 'active';

        // Extend subscription period
        const now = new Date();
        const plan = subscription.plan;

        if (plan.interval === PlanInterval.MONTHLY) {
          subscription.current_period_end = new Date(
            now.setMonth(now.getMonth() + plan.interval_count),
          );
        } else if (plan.interval === PlanInterval.YEARLY) {
          subscription.current_period_end = new Date(
            now.setFullYear(now.getFullYear() + plan.interval_count),
          );
        }

        await this.organizationSubscriptionRepository.save(subscription);
        this.logger.log(`Organization subscription ${subscription.id} renewed`);
      }
    }
  }
}
