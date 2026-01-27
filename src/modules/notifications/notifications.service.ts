import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { NotificationType } from './interfaces/notification.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private stats = {
    emailsSent: 0,
    emailsFailed: 0,
    smsSent: 0,
    smsFailed: 0,
  };

  constructor(
    private emailService: EmailService,
    private smsService: SmsService,
    private configService: ConfigService,
  ) {}

  async sendWelcomeEmail(data: {
    email: string;
    userName: string;
    organizationName: string;
  }) {
    await this.emailService.sendEmail({
      to: data.email,
      subject: `Welcome to ${data.organizationName}!`,
      template: 'welcome_email',
      context: data,
    });

    this.logger.log(`Welcome email sent to ${data.email}`);
    this.stats.emailsSent++;
  }

  async sendPaymentSuccessNotification(data: {
    email: string;
    phone?: string;
    memberName: string;
    amount: number;
    currency: string;
    reference: string;
    paidAt: Date;
    channel: string;
  }) {
    // Send email
    await this.emailService.sendEmail({
      to: data.email,
      subject: 'Payment Successful - Receipt',
      template: 'payment_success',
      context: data,
    });

    // Send SMS if phone is provided
    if (data.phone) {
      await this.smsService.sendSMS({
        to: data.phone,
        message: this.smsService.getSMSTemplate('payment_success', data),
      });
    }

    this.logger.log(`Payment success notification sent to ${data.email}`);
    this.stats.emailsSent++;
  }

  async sendPaymentFailedNotification(data: {
    email: string;
    phone?: string;
    memberName: string;
    amount: number;
    currency: string;
    failureReason: string;
    invoiceNumber: string;
    paymentUrl: string;
  }) {
    const emailHtml = `
    <h2>Payment Failed</h2>
    <p>Hi ${data.memberName},</p>
    <p>Your payment of ${data.currency} ${data.amount} for invoice ${data.invoiceNumber} failed.</p>
    <p><strong>Reason:</strong> ${data.failureReason}</p>
    <p>Please update your payment method or try again:</p>
    <a href="${data.paymentUrl}">Pay Now</a>
  `;

    await this.emailService.sendEmail({
      to: data.email,
      subject: 'Payment Failed - Action Required',
      template: 'payment_failed',
      context: data,
      // html: emailHtml,
    });

    if (data.phone) {
      await this.smsService.sendSMS({
        to: data.phone,
        message: this.smsService.getSMSTemplate('payment_failed', data),
      });
    }

    this.logger.log(`Payment failed notification sent to ${data.email}`);
    this.stats.emailsSent++;
  }

  async sendPaymentReminderNotification(data: {
    email: string;
    memberName: string;
    subscriptionName: string;
    amount: number;
    currency: string;
    invoiceNumber: string;
    paymentUrl: string;
    dueDate: Date;
  }) {
    await this.emailService.sendEmail({
      to: data.email,
      subject: `Payment Reminder: Action Required for ${data.subscriptionName}`,
      template: 'payment_reminder',
      context: {
        memberName: data.memberName,
        subscriptionName: data.subscriptionName,
        amount: data.amount.toLocaleString('en-NG', {
          style: 'currency',
          currency: data.currency || 'NGN',
        }),
        invoiceNumber: data.invoiceNumber,
        paymentUrl: data.paymentUrl,
        dueDate: data.dueDate.toLocaleDateString(),
      },
    });
    this.logger.log(`Payment reminder sent to ${data.email}`);
    this.stats.emailsSent++;
  }

  async sendSubscriptionCreatedNotification(data: {
    email: string;
    phone?: string;
    memberName: string;
    planName: string;
    amount: number;
    currency: string;
    interval: string;
    startDate: Date;
    nextBilling: Date;
    trialEnd?: Date;
  }) {
    await this.emailService.sendEmail({
      to: data.email,
      subject: `Welcome to ${data.planName}!`,
      template: 'subscription_created',
      context: data,
    });

    this.logger.log(`Subscription created notification sent to ${data.email}`);
    this.stats.emailsSent++;
  }

  async sendSubscriptionExpiringNotification(data: {
    email: string;
    phone?: string;
    memberName: string;
    planName: string;
    expiryDate: Date;
    daysLeft: number;
    renewUrl: string;
  }) {
    await this.emailService.sendEmail({
      to: data.email,
      subject: `Your subscription expires in ${data.daysLeft} days`,
      template: 'subscription_expiring',
      context: data,
    });

    if (data.phone) {
      await this.smsService.sendSMS({
        to: data.phone,
        message: this.smsService.getSMSTemplate('subscription_expiring', data),
      });
    }

    this.logger.log(`Subscription expiring notification sent to ${data.email}`);
    this.stats.emailsSent++;
  }

  async sendSubscriptionExpiredNotification(data: {
    email: string;
    phone?: string;
    memberName: string;
    planName: string;
    reactivateUrl: string;
  }) {
    await this.emailService.sendEmail({
      to: data.email,
      subject: 'Your subscription has expired',
      template: 'subscription_expired',
      context: data,
    });

    if (data.phone) {
      await this.smsService.sendSMS({
        to: data.phone,
        message: this.smsService.getSMSTemplate('subscription_expired', data),
      });
    }

    this.logger.log(`Subscription expired notification sent to ${data.email}`);
    this.stats.emailsSent++;
  }

  async sendSubscriptionRenewedNotification(data: {
    email: string;
    memberName: string;
    subscriptionName: string;
    amount: number;
    currency: string;
    nextBillingDate: Date;
  }) {
    await this.emailService.sendEmail({
      to: data.email,
      subject: `Subscription Renewal Confirmation - ${data.subscriptionName}`,
      template: 'subscription_renewed',
      context: {
        memberName: data.memberName,
        subscriptionName: data.subscriptionName,
        amount: data.amount.toLocaleString('en-NG', {
          style: 'currency',
          currency: data.currency || 'NGN',
        }),
        nextBillingDate: data.nextBillingDate.toLocaleDateString(),
      },
    });
    this.logger.log(`Subscription renewal confirmation sent to ${data.email}`);
    this.stats.emailsSent++;
  }

  async sendRenewalFailedNotification(data: {
    email: string;
    memberName: string;
    subscriptionName: string;
    amount: number;
    currency: string;
    invoiceNumber?: string;
    paymentUrl: string;
    expiresAt: Date;
  }) {
    const emailHtml = `
    <h2>Subscription Renewal Failed</h2>
    <p>Hi ${data.memberName},</p>
    <p>We couldn't renew your ${data.subscriptionName} subscription.</p>
    <p><strong>Amount:</strong> ${data.currency} ${data.amount}</p>
    <p><strong>Action Required:</strong></p>
    <ul>
      <li>Update your payment method</li>
      <li>Or make a manual payment</li>
    </ul>
    <p>Your subscription will expire on ${data.expiresAt.toDateString()}</p>
    <a href="${data.paymentUrl}">Update Payment Method</a>
  `;

    await this.emailService.sendEmail({
      to: data.email,
      subject: `⚠️ Action Required: Subscription Renewal Failed - ${data.subscriptionName}`,
      template: 'renewal_failed',
      context: {
        memberName: data.memberName,
        subscriptionName: data.subscriptionName,
        amount: data.amount.toLocaleString('en-NG', {
          style: 'currency',
          currency: data.currency || 'NGN',
        }),
        invoiceNumber: data.invoiceNumber,
        paymentUrl: data.paymentUrl,
        expiresAt: data.expiresAt.toLocaleDateString(),
        supportEmail:
          this.configService.get('SUPPORT_EMAIL') || 'support@reetrack.com',
      },
      // html: emailHtml
    });
    this.logger.log(`Renewal failed notification sent to ${data.email}`);
    this.stats.emailsSent++;
  }

  async sendInvoiceCreatedNotification(data: {
    email: string;
    memberName: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    dueDate: Date;
    paymentUrl: string;
  }) {
    await this.emailService.sendEmail({
      to: data.email,
      subject: `New Invoice: ${data.invoiceNumber}`,
      template: 'invoice_created',
      context: data,
    });

    this.logger.log(`Invoice created notification sent to ${data.email}`);
    this.stats.emailsSent++;
  }

  async sendInvoiceOverdueNotification(data: {
    email: string;
    phone?: string;
    memberName: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    dueDate: Date;
    daysOverdue: number;
    paymentUrl: string;
  }) {
    await this.emailService.sendEmail({
      to: data.email,
      subject: `Invoice Overdue: ${data.invoiceNumber}`,
      template: 'invoice_overdue',
      context: data,
    });

    if (data.phone) {
      await this.smsService.sendSMS({
        to: data.phone,
        message: this.smsService.getSMSTemplate('invoice_overdue', data),
      });
    }

    this.logger.log(`Invoice overdue notification sent to ${data.email}`);
    this.stats.emailsSent++;
  }

  async sendSubscriptionCanceledNotification(data: {
    email: string;
    memberName: string;
    subscriptionName: string;
    expiresAt: Date;
  }) {
    await this.emailService.sendEmail({
      to: data.email,
      subject: 'Your subscription has been canceled',
      template: 'subscription_canceled',
      context: data,
    });

    this.logger.log(`Subscription canceled notification sent to ${data.email}`);
    this.stats.emailsSent++;
  }

  async sendOrgSubscriptionCanceledNotification(data: {
    email: string;
    memberName: string;
    subscriptionName: string;
    expiresAt: Date;
  }) {
    await this.emailService.sendEmail({
      to: data.email,
      subject: 'Your subscription has been canceled',
      template: 'subscription_canceled',
      context: data,
    });

    this.logger.log(`Subscription canceled notification sent to ${data.email}`);
    this.stats.emailsSent++;
  }
}
