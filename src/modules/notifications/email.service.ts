import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailOptions } from './interfaces/notification.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('smtp.host'),
      port: this.configService.get('smtp.port'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('smtp.user'),
        pass: this.configService.get('smtp.password'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const html = this.getEmailTemplate(options.template, options.context);

      await this.transporter.sendMail({
        from: `"${this.configService.get('smtp.fromName')}" <${this.configService.get('smtp.fromEmail')}>`,
        to: options.to,
        subject: options.subject,
        html,
      });

      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}:`,
        error.message,
      );
      return false;
    }
  }

  private getEmailTemplate(
    template: string,
    context: Record<string, any>,
  ): string {
    const templates = {
      payment_success: this.paymentSuccessTemplate(context),
      payment_failed: this.paymentFailedTemplate(context),
      subscription_created: this.subscriptionCreatedTemplate(context),
      subscription_expiring: this.subscriptionExpiringTemplate(context),
      subscription_expired: this.subscriptionExpiredTemplate(context),
      invoice_created: this.invoiceCreatedTemplate(context),
      invoice_overdue: this.invoiceOverdueTemplate(context),
      welcome_email: this.welcomeEmailTemplate(context),
    };

    return templates[template] || this.defaultTemplate(context);
  }

  private welcomeEmailTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to ${context.organizationName}!</h1>
          </div>
          <div class="content">
            <p>Hi ${context.userName},</p>
            <p>Welcome! Your account has been created successfully.</p>
            <p>You can now start managing your subscriptions and members.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from WIllow</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private paymentSuccessTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .amount { font-size: 32px; font-weight: bold; color: #4CAF50; }
          .details { background: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Successful</h1>
          </div>
          <div class="content">
            <p>Hi ${context.memberName},</p>
            <p>Your payment has been processed successfully!</p>
            
            <div class="details">
              <p><strong>Amount Paid:</strong> <span class="amount">${context.currency} ${context.amount}</span></p>
              <p><strong>Reference:</strong> ${context.reference}</p>
              <p><strong>Date:</strong> ${new Date(context.paidAt).toLocaleString()}</p>
              <p><strong>Payment Method:</strong> ${context.channel}</p>
            </div>

            <p>Thank you for your payment!</p>
          </div>
          <div class="footer">
            <p>This is an automated email from WIllow</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private paymentFailedTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .details { background: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Payment Failed</h1>
          </div>
          <div class="content">
            <p>Hi ${context.memberName},</p>
            <p>We were unable to process your payment.</p>
            
            <div class="details">
              <p><strong>Amount:</strong> ${context.currency} ${context.amount}</p>
              <p><strong>Reason:</strong> ${context.failureReason}</p>
              <p><strong>Invoice Number:</strong> ${context.invoiceNumber}</p>
            </div>

            <p>Please update your payment method and try again.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${context.paymentUrl}" class="button">Retry Payment</a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated email from WIllow</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private subscriptionCreatedTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .details { background: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to ${context.planName}!</h1>
          </div>
          <div class="content">
            <p>Hi ${context.memberName},</p>
            <p>Your subscription has been activated successfully!</p>
            
            <div class="details">
              <p><strong>Plan:</strong> ${context.planName}</p>
              <p><strong>Amount:</strong> ${context.currency} ${context.amount} / ${context.interval}</p>
              <p><strong>Start Date:</strong> ${new Date(context.startDate).toLocaleDateString()}</p>
              <p><strong>Next Billing:</strong> ${new Date(context.nextBilling).toLocaleDateString()}</p>
              ${context.trialEnd ? `<p><strong>Trial Ends:</strong> ${new Date(context.trialEnd).toLocaleDateString()}</p>` : ''}
            </div>

            <p>Thank you for subscribing!</p>
          </div>
          <div class="footer">
            <p>This is an automated email from WIllow</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private subscriptionExpiringTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Subscription Expiring Soon</h1>
          </div>
          <div class="content">
            <p>Hi ${context.memberName},</p>
            <p>Your subscription to <strong>${context.planName}</strong> will expire in ${context.daysLeft} days.</p>
            <p><strong>Expiry Date:</strong> ${new Date(context.expiryDate).toLocaleDateString()}</p>
            <p>Renew now to continue enjoying uninterrupted service.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${context.renewUrl}" class="button">Renew Subscription</a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated email from WIllow</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private subscriptionExpiredTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #9E9E9E; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Expired</h1>
          </div>
          <div class="content">
            <p>Hi ${context.memberName},</p>
            <p>Your subscription to <strong>${context.planName}</strong> has expired.</p>
            <p>Reactivate your subscription to regain access.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${context.reactivateUrl}" class="button">Reactivate Now</a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated email from WIllow</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private invoiceCreatedTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #673AB7; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .details { background: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 New Invoice</h1>
          </div>
          <div class="content">
            <p>Hi ${context.memberName},</p>
            <p>A new invoice has been generated for your subscription.</p>
            
            <div class="details">
              <p><strong>Invoice Number:</strong> ${context.invoiceNumber}</p>
              <p><strong>Amount Due:</strong> ${context.currency} ${context.amount}</p>
              <p><strong>Due Date:</strong> ${new Date(context.dueDate).toLocaleDateString()}</p>
            </div>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${context.paymentUrl}" class="button">Pay Now</a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated email from WIllow</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private invoiceOverdueTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .details { background: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Invoice Overdue</h1>
          </div>
          <div class="content">
            <p>Hi ${context.memberName},</p>
            <p>Your invoice is now <strong>${context.daysOverdue} days overdue</strong>.</p>
            
            <div class="details">
              <p><strong>Invoice Number:</strong> ${context.invoiceNumber}</p>
              <p><strong>Amount Due:</strong> ${context.currency} ${context.amount}</p>
              <p><strong>Original Due Date:</strong> ${new Date(context.dueDate).toLocaleDateString()}</p>
            </div>

            <p>Please make payment as soon as possible to avoid service interruption.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${context.paymentUrl}" class="button">Pay Now</a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated email from WIllow</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private defaultTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <body>
        <p>${context.message || 'Notification from WIllow'}</p>
      </body>
      </html>
    `;
  }
}
