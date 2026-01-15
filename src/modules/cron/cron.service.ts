// The @Cron schedule is in the format of:

// * * * * * *
// | | | | | |
// | | | | | day of week (0-7, 0 and 7 = Sunday)
// | | | | month (1-12)
// | | | day of month (1-31)
// | | hour (0-23)
// | minute (0-59)
// second (0-59, optional)

// Common Patterns:
// Pattern            Description
// @Cron('0 0 * * *')Every day at midnight
// @Cron('0 9 * * *')Every day at 9 AM
// @Cron('0 */6 * * *')Every 6 hours
// @Cron('0 0 * * 0')Every Sunday at midnight
// @Cron('*/30 * * * *')Every 30 minutes

// @Cron(CronExpression.EVERY_HOUR)        // Every hour
// @Cron(CronExpression.EVERY_DAY_AT_1AM)  // 1 AM daily
// @Cron(CronExpression.EVERY_WEEK)        // Every week
// @Cron(CronExpression.EVERY_30_SECONDS)  // Every 30s (testing)

// @Cron('0 9 * * *', {
//   timeZone: 'Africa/Lagos', // Set timezone
// })

// src/modules/cron/cron.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MemberSubscription } from '../../database/entities/member-subscription.entity';
import { Invoice, InvoiceStatus } from '../../database/entities/invoice.entity';
import { MemberPlan } from '../../database/entities/member-plan.entity';
import { Member } from '../../database/entities/member.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthService } from '../auth/auth.service';
import { generateInvoiceNumber } from '../../common/utils/invoice-number.util';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectRepository(MemberSubscription)
    private memberSubscriptionRepository: Repository<MemberSubscription>,

    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,

    @InjectRepository(MemberPlan)
    private memberPlanRepository: Repository<MemberPlan>,

    @InjectRepository(Member)
    private memberRepository: Repository<Member>,

    private notificationsService: NotificationsService,
    private configService: ConfigService,
    private authService: AuthService,
  ) {}

  // CHECK AND EXPIRE SUBSCRIPTIONS
  // Runs every hour
  @Cron(CronExpression.EVERY_HOUR)
  async checkExpiredSubscriptions() {
    this.logger.log('🔍 Checking for expired subscriptions...');

    const now = new Date();

    const expiredSubscriptions = await this.memberSubscriptionRepository.find({
      where: {
        status: In(['active', 'trialing']),
        expires_at: LessThan(now),
      },
      relations: ['member', 'plan'],
    });

    for (const subscription of expiredSubscriptions) {
      subscription.status = 'expired';
      await this.memberSubscriptionRepository.save(subscription);

      // Send notification
      const frontendUrl = this.configService.get('frontend.url');
      await this.notificationsService.sendSubscriptionExpiredNotification({
        email: subscription.member.user.email,
        phone: subscription.member.user.phone,
        memberName: `${subscription.member.user.first_name} ${subscription.member.user.last_name}`,
        planName: subscription.plan.name,
        reactivateUrl: `${frontendUrl}/subscriptions/${subscription.id}/renew`,
      });

      this.logger.log(`Subscription ${subscription.id} marked as expired`);
    }

    this.logger.log(`✅ Expired ${expiredSubscriptions.length} subscriptions`);
  }

  // CHECK TRIALING SUBSCRIPTIONS
  // Convert trials to active and generate invoices
  // Runs every hour
  //   @Cron(CronExpression.EVERY_HOUR)
  //   async checkTrialingSubscriptions() {
  //     this.logger.log('🔍 Checking trialing subscriptions...');

  //     const now = new Date();

  //     const trialEndedSubscriptions = await this.memberSubscriptionRepository.find({
  //       where: {
  //         status: 'trialing',
  //         trial_end: LessThan(now),
  //       },
  //       relations: ['plan', 'member', 'organization'],
  //     });

  //     for (const subscription of trialEndedSubscriptions) {
  //       subscription.status = 'active';
  //       await this.memberSubscriptionRepository.save(subscription);

  //       // Create invoice for first payment
  //       const invoice = this.invoiceRepository.create({
  //         organization_id: subscription.organization_id,
  //         subscription_id: subscription.id,
  //         member_id: subscription.member_id,
  //         invoice_number: generateInvoiceNumber(subscription.organization_id),
  //         amount: subscription.plan.amount,
  //         currency: subscription.plan.currency,
  //         status: 'pending',
  //         due_date: subscription.expires_at,
  //         metadata: {
  //           plan_name: subscription.plan.name,
  //           trial_ended: true,
  //         },
  //       });

  //       await this.invoiceRepository.save(invoice);

  //       // Send notification
  //       const frontendUrl = this.configService.get('frontend.url');
  //       await this.notificationsService.sendInvoiceCreatedNotification({
  //         email: subscription.member.user.email,
  //         memberName: `${subscription.member.user.first_name} ${subscription.member.user.last_name}`,
  //         invoiceNumber: invoice.invoice_number,
  //         amount: invoice.amount,
  //         currency: invoice.currency,
  //         dueDate: invoice.due_date,
  //         paymentUrl: `${frontendUrl}/invoices/${invoice.id}/pay`,
  //       });

  //       this.logger.log(
  //         `Trial ended for subscription ${subscription.id}, invoice created`,
  //       );
  //     }

  //     this.logger.log(
  //       `✅ Processed ${trialEndedSubscriptions.length} trial subscriptions`,
  //     );
  //   }

  // SEND EXPIRY REMINDERS
  // Notify members 7 days, 3 days, and 1 day before expiry
  // Runs daily at 9 AM
  @Cron('0 9 * * *') // 9 AM daily
  async sendExpiryReminders() {
    this.logger.log('📧 Sending subscription expiry reminders...');

    const now = new Date();
    const frontendUrl = this.configService.get('frontend.url');

    // Check for subscriptions expiring in 7, 3, and 1 day(s)
    const reminderDays = [7, 3, 1];

    for (const days of reminderDays) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);

      // Get start and end of target day
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const expiringSubscriptions =
        await this.memberSubscriptionRepository.find({
          where: {
            status: 'active',
            expires_at: Between(startOfDay, endOfDay),
          },
          relations: ['members', 'plan'],
        });

      for (const subscription of expiringSubscriptions) {
        await this.notificationsService.sendSubscriptionExpiringNotification({
          email: subscription.member.user.email,
          phone: subscription.member.user.phone,
          memberName: `${subscription.member.user.first_name} ${subscription.member.user.last_name}`,
          planName: subscription.plan.name,
          expiryDate: subscription.expires_at,
          daysLeft: days,
          renewUrl: `${frontendUrl}/subscriptions/${subscription.id}/renew`,
        });

        this.logger.log(
          `Sent ${days}-day expiry reminder for subscription ${subscription.id}`,
        );
      }

      this.logger.log(
        `✅ Sent ${expiringSubscriptions.length} reminders for ${days}-day expiry`,
      );
    }
  }

  // CHECK OVERDUE INVOICES
  // Send reminders for overdue invoices
  // Runs daily at 10 AM
  @Cron('0 10 * * *') // 10 AM daily
  async checkOverdueInvoices() {
    this.logger.log('📧 Checking overdue invoices...');

    const now = new Date();
    const frontendUrl = this.configService.get('frontend.url');

    const overdueInvoices = await this.invoiceRepository.find({
      where: {
        status: In(['pending', 'overdue']),
        due_date: LessThan(now),
      },
      relations: ['users'],
    });

    for (const invoice of overdueInvoices) {
      const daysOverdue = Math.floor(
        (now.getTime() - invoice.due_date.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Send reminder on days 1, 3, 7, 14, 30
      const reminderDays = [1, 3, 7, 14, 30];

      if (reminderDays.includes(daysOverdue)) {
        await this.notificationsService.sendInvoiceOverdueNotification({
          email: invoice.billed_user.email,
          phone: invoice.billed_user.phone,
          memberName: `${invoice.billed_user.first_name} ${invoice.billed_user.last_name}`,
          invoiceNumber: invoice.invoice_number,
          amount: invoice.amount,
          currency: invoice.currency,
          dueDate: invoice.due_date,
          daysOverdue,
          paymentUrl: `${frontendUrl}/invoices/${invoice.id}/pay`,
        });

        this.logger.log(
          `Sent overdue reminder for invoice ${invoice.invoice_number} (${daysOverdue} days)`,
        );
      }
    }

    this.logger.log(`✅ Checked ${overdueInvoices.length} overdue invoices`);
  }

  // AUTO-RENEW SUBSCRIPTIONS
  // Generate invoices for upcoming renewals
  // Runs daily at 8 AM
  @Cron('0 8 * * *') // 8 AM daily
  async autoRenewSubscriptions() {
    this.logger.log('🔄 Processing subscription auto-renewals...');

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get subscriptions renewing tomorrow
    const startOfTomorrow = new Date(tomorrow);
    startOfTomorrow.setHours(0, 0, 0, 0);

    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const renewingSubscriptions = await this.memberSubscriptionRepository.find({
      where: {
        status: 'active',
        expires_at: Between(startOfTomorrow, endOfTomorrow),
      },
      relations: ['member_plans', 'members', 'organizations'],
    });

    for (const subscription of renewingSubscriptions) {
      // Update subscription period
      const newPeriodStart = subscription.expires_at;
      const newPeriodEnd = this.calculatePeriodEnd(
        newPeriodStart,
        subscription.plan.interval,
        subscription.plan.interval_count,
      );

      subscription.expires_at = newPeriodEnd;
      await this.memberSubscriptionRepository.save(subscription);

      // Create invoice for renewal
      const invoice = this.invoiceRepository.create({
        issuer_org_id: subscription.organization_id,
        member_subscription_id: subscription.id,
        billed_user_id: subscription.member_id,
        invoice_number: generateInvoiceNumber(subscription.organization_id),
        amount: subscription.plan.price,
        currency: subscription.plan.currency,
        status: InvoiceStatus.PENDING,
        due_date: newPeriodEnd,
        metadata: {
          plan_name: subscription.plan.name,
          renewal: true,
          billing_period: {
            start: newPeriodStart,
            end: newPeriodEnd,
          },
        },
      });

      await this.invoiceRepository.save(invoice);

      // Send notification
      const frontendUrl = this.configService.get('frontend.url');
      await this.notificationsService.sendInvoiceCreatedNotification({
        email: subscription.member.user.email,
        memberName: `${subscription.member.user.first_name} ${subscription.member.user.last_name}`,
        invoiceNumber: invoice.invoice_number,
        amount: invoice.amount,
        currency: invoice.currency,
        dueDate: invoice.due_date,
        paymentUrl: `${frontendUrl}/invoices/${invoice.id}/pay`,
      });

      this.logger.log(
        `Renewed subscription ${subscription.id}, invoice ${invoice.id} created`,
      );
    }

    this.logger.log(`✅ Processed ${renewingSubscriptions.length} renewals`);
  }

  // CLEANUP OLD RECORDS
  // Delete very old canceled/expired subscriptions and invoices
  // Also cleanup expired refresh tokens
  // Runs weekly on Sunday at 2 AM
  @Cron('0 2 * * 0') // 2 AM every Sunday
  async cleanupOldRecords() {
    this.logger.log('🧹 Cleaning up old records...');

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Delete old canceled invoices
    const deletedInvoices = await this.invoiceRepository
      .createQueryBuilder()
      .delete()
      .where('status = :status', { status: InvoiceStatus.CANCELLED })
      .andWhere('created_at < :date', { date: sixMonthsAgo })
      .execute();

    // Cleanup expired refresh tokens
    const deletedTokens = await this.authService.cleanupExpiredTokens();

    this.logger.log(`✅ Deleted ${deletedInvoices.affected} old invoices`);
    this.logger.log(`✅ Deleted ${deletedTokens} expired refresh tokens`);
  }

  // GENERATE DAILY STATS
  // Calculate and cache daily statistics
  // Runs daily at midnight
  @Cron('0 0 * * *') // Midnight daily
  async generateDailyStats() {
    this.logger.log('📊 Generating daily statistics...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // This could store stats in a separate table for analytics
    const [
      activeSubscriptions,
      newSubscriptions,
      expiredSubscriptions,
      totalRevenue,
    ] = await Promise.all([
      this.memberSubscriptionRepository.count({ where: { status: 'active' } }),
      this.memberSubscriptionRepository.count({
        where: {
          status: 'active',
          created_at: Between(today, tomorrow),
        },
      }),
      this.memberSubscriptionRepository.count({
        where: {
          status: 'expired',
          expires_at: Between(today, tomorrow),
        },
      }),
      this.invoiceRepository
        .createQueryBuilder('invoice')
        .select('COALESCE(SUM(amount), 0)', 'total')
        .where('status = :status', { status: 'paid' })
        .andWhere('paid_at >= :start', { start: today })
        .andWhere('paid_at < :end', { end: tomorrow })
        .getRawOne(),
    ]);

    this.logger.log(`
      📊 Daily Stats for ${today.toDateString()}:
      - Active Subscriptions: ${activeSubscriptions}
      - New Subscriptions: ${newSubscriptions}
      - Expired Today: ${expiredSubscriptions}
      - Revenue Today: ${totalRevenue.total}
    `);

    // You could save these to a DailyStats table for historical analytics
  }

  // HELPER METHODS
  private calculatePeriodEnd(
    startDate: Date,
    interval: string,
    intervalCount: number,
  ): Date {
    const date = new Date(startDate);

    switch (interval) {
      case 'weekly':
        date.setDate(date.getDate() + 7 * intervalCount);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + intervalCount);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + intervalCount);
        break;
    }

    return date;
  }

  // MANUAL TRIGGER ENDPOINTS (For Testing)
  async manualCheckExpiredSubscriptions() {
    await this.checkExpiredSubscriptions();
    return { message: 'Expired subscriptions check completed' };
  }

  async manualSendExpiryReminders() {
    await this.sendExpiryReminders();
    return { message: 'Expiry reminders sent' };
  }

  async manualCheckOverdueInvoices() {
    await this.checkOverdueInvoices();
    return { message: 'Overdue invoices check completed' };
  }

  async manualAutoRenewSubscriptions() {
    await this.autoRenewSubscriptions();
    return { message: 'Auto-renewals processed' };
  }
}
