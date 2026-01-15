import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { NotificationType } from './interfaces/notification.interface';

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
    await this.emailService.sendEmail({
      to: data.email,
      subject: 'Payment Failed - Action Required',
      template: 'payment_failed',
      context: data,
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
}
