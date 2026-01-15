import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan } from 'typeorm';
import {
  MemberSubscription,
  SubscriptionStatus,
} from '../../database/entities/member-subscription.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { Payment } from '../../database/entities/payment.entity';
import { Member } from '../../database/entities/member.entity';
import { MemberPlan } from '../../database/entities/member-plan.entity';
import {
  MRRData,
  ChurnData,
  RevenueData,
  MemberGrowthData,
  RevenueChartData,
  PlanPerformanceData,
} from './interfaces/analytics.interface';
import { AnalyticsQueryDto, TimePeriod } from './dto/analytics-query.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(MemberSubscription)
    private memberSubscriptionRepository: Repository<MemberSubscription>,

    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,

    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,

    @InjectRepository(Member)
    private memberRepository: Repository<Member>,

    @InjectRepository(MemberPlan)
    private memberPlanRepository: Repository<MemberPlan>,
  ) {}

  // ============================================
  // OVERVIEW / DASHBOARD SUMMARY
  // ============================================
  async getOverview(organizationId: string, queryDto: AnalyticsQueryDto) {
    const { startDate, endDate } = this.getDateRange(queryDto);

    const [mrr, revenue, members, payments, subscriptions] = await Promise.all([
      this.calculateMRR(organizationId),
      this.calculateRevenue(organizationId, startDate, endDate),
      this.getMemberGrowth(organizationId, startDate, endDate),
      this.getPaymentStats(organizationId, startDate, endDate),
      this.getSubscriptionStats(organizationId, startDate, endDate),
    ]);

    return {
      message: 'Analytics overview retrieved successfully',
      data: {
        mrr,
        revenue,
        members,
        payments,
        subscriptions,
        period: {
          start: startDate,
          end: endDate,
        },
      },
    };
  }

  // ============================================
  // MRR (Monthly Recurring Revenue)
  // ============================================
  async calculateMRR(organizationId: string): Promise<MRRData> {
    // Get active monthly subscriptions
    const activeSubscriptions = await this.memberSubscriptionRepository.find({
      where: {
        organization_id: organizationId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['plan'],
    });

    // Calculate current MRR
    let currentMRR = 0;
    for (const subscription of activeSubscriptions) {
      const monthlyAmount = this.normalizeToMonthly(
        subscription.plan.price,
        subscription.plan.interval,
        subscription.plan.interval_count,
      );
      currentMRR += monthlyAmount;
    }

    // Get previous month's MRR for comparison
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const previousSubscriptions = await this.memberSubscriptionRepository
      .createQueryBuilder('member_subscriptions')
      .leftJoinAndSelect('member_subscriptions.plan', 'member_plans')
      .where('member_subscriptions.organization_id = :orgId', {
        orgId: organizationId,
      })
      .andWhere('member_subscriptions.status = :status', {
        status: SubscriptionStatus.ACTIVE,
      })
      .andWhere('member_subscriptions.created_at <= :date', { date: lastMonth })
      .getMany();

    let previousMRR = 0;
    for (const subscription of previousSubscriptions) {
      const monthlyAmount = this.normalizeToMonthly(
        subscription.plan.price,
        subscription.plan.interval,
        subscription.plan.interval_count,
      );
      previousMRR += monthlyAmount;
    }

    const growthAmount = currentMRR - previousMRR;
    const growthRate = previousMRR > 0 ? (growthAmount / previousMRR) * 100 : 0;

    return {
      current_mrr: Math.round(currentMRR),
      previous_mrr: Math.round(previousMRR),
      growth_rate: parseFloat(growthRate.toFixed(2)),
      growth_amount: Math.round(growthAmount),
    };
  }

  // ============================================
  // CHURN RATE
  // ============================================
  async calculateChurn(
    organizationId: string,
    queryDto: AnalyticsQueryDto,
  ): Promise<ChurnData> {
    const { startDate, endDate } = this.getDateRange(queryDto);

    // Get members at start of period
    const membersAtStart = await this.memberRepository.count({
      where: {
        created_at: LessThan(startDate),
        organization_user: { organization_id: organizationId },
      },
      relations: ['organization_users'],
    });

    // Get churned subscriptions in period
    const churnedSubscriptions = await this.memberSubscriptionRepository.count({
      where: {
        organization_id: organizationId,
        status: SubscriptionStatus.CANCELED,
        canceled_at: Between(startDate, endDate),
      },
    });

    const churnRate =
      membersAtStart > 0 ? (churnedSubscriptions / membersAtStart) * 100 : 0;

    return {
      churned_members: churnedSubscriptions,
      total_members: membersAtStart,
      churn_rate: parseFloat(churnRate.toFixed(2)),
      period: queryDto.period as string,
    };
  }

  // ============================================
  // REVENUE ANALYTICS
  // ============================================
  async calculateRevenue(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<RevenueData> {
    // Total revenue all time
    const totalRevenueResult = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(amount), 0)', 'total')
      .where('organization_id = :orgId', { orgId: organizationId })
      .andWhere('status = :status', { status: 'success' })
      .getRawOne();

    // Period revenue
    const periodRevenueResult = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(amount), 0)', 'total')
      .where('organization_id = :orgId', { orgId: organizationId })
      .andWhere('status = :status', { status: 'success' })
      .andWhere('created_at BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .getRawOne();

    // Previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStart = new Date(startDate.getTime() - periodLength);
    const previousEnd = startDate;

    const previousRevenueResult = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(amount), 0)', 'total')
      .where('organization_id = :orgId', { orgId: organizationId })
      .andWhere('status = :status', { status: 'success' })
      .andWhere('created_at BETWEEN :start AND :end', {
        start: previousStart,
        end: previousEnd,
      })
      .getRawOne();

    const totalRevenue = parseFloat(totalRevenueResult.total);
    const periodRevenue = parseFloat(periodRevenueResult.total);
    const previousRevenue = parseFloat(previousRevenueResult.total);

    const growthAmount = periodRevenue - previousRevenue;
    const growthRate =
      previousRevenue > 0 ? (growthAmount / previousRevenue) * 100 : 0;

    // Average transaction value
    const transactionCount = await this.paymentRepository.count({
      where: {
        payer_org_id: organizationId,
        status: 'success',
        created_at: Between(startDate, endDate),
      },
    });

    const averageTransaction =
      transactionCount > 0 ? periodRevenue / transactionCount : 0;

    return {
      total_revenue: Math.round(totalRevenue),
      period_revenue: Math.round(periodRevenue),
      growth_rate: parseFloat(growthRate.toFixed(2)),
      average_transaction: Math.round(averageTransaction),
    };
  }

  // ============================================
  //  Member GROWTH
  // ============================================
  async getMemberGrowth(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<MemberGrowthData> {
    // New members in period
    const newMembers = await this.memberRepository.count({
      where: {
        created_at: Between(startDate, endDate),
        organization_user: { organization_id: organizationId },
      },
      relations: ['organization_users'],
    });

    // Churned members (canceled subscriptions)
    const churnedMembers = await this.memberSubscriptionRepository.count({
      where: {
        organization_id: organizationId,
        status: SubscriptionStatus.CANCELED,
        canceled_at: Between(startDate, endDate),
      },
    });

    // Total members
    const totalMembers = await this.memberRepository.count({
      where: { organization_user: { organization_id: organizationId } },
      relations: ['organization_users'],
    });

    return {
      new_members: newMembers,
      churned_members: churnedMembers,
      net_growth: newMembers - churnedMembers,
      total_members: totalMembers,
    };
  }

  // ============================================
  // PAYMENT STATISTICS
  // ============================================
  async getPaymentStats(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const [total, successful, failed, pending] = await Promise.all([
      this.paymentRepository.count({
        where: {
          payer_org_id: organizationId,
          created_at: Between(startDate, endDate),
        },
      }),
      this.paymentRepository.count({
        where: {
          payer_org_id: organizationId,
          status: 'success',
          created_at: Between(startDate, endDate),
        },
      }),
      this.paymentRepository.count({
        where: {
          payer_org_id: organizationId,
          status: 'failed',
          created_at: Between(startDate, endDate),
        },
      }),
      this.paymentRepository.count({
        where: {
          payer_org_id: organizationId,
          status: 'pending',
          created_at: Between(startDate, endDate),
        },
      }),
    ]);

    const successRate = total > 0 ? (successful / total) * 100 : 0;

    return {
      total_payments: total,
      successful_payments: successful,
      failed_payments: failed,
      pending_payments: pending,
      success_rate: parseFloat(successRate.toFixed(2)),
    };
  }

  // ============================================
  // SUBSCRIPTION STATISTICS
  // ============================================
  async getSubscriptionStats(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const [total, active, expired, canceled, paused] = await Promise.all([
      this.memberSubscriptionRepository.count({
        where: { organization_id: organizationId },
      }),
      this.memberSubscriptionRepository.count({
        where: { organization_id: organizationId, status: 'active' },
      }),
      this.memberSubscriptionRepository.count({
        where: { organization_id: organizationId, status: 'expired' },
      }),
      this.memberSubscriptionRepository.count({
        where: { organization_id: organizationId, status: 'canceled' },
      }),
      this.memberSubscriptionRepository.count({
        where: { organization_id: organizationId, status: 'paused' },
      }),
    ]);

    // New subscriptions in period
    const newSubscriptions = await this.memberSubscriptionRepository.count({
      where: {
        organization_id: organizationId,
        created_at: Between(startDate, endDate),
      },
    });

    return {
      total_subscriptions: total,
      active_subscriptions: active,
      expired_subscriptions: expired,
      canceled_subscriptions: canceled,
      paused_subscriptions: paused,
      new_subscriptions: newSubscriptions,
    };
  }

  // ============================================
  // REVENUE CHART DATA
  // ============================================
  async getRevenueChart(
    organizationId: string,
    queryDto: AnalyticsQueryDto,
  ): Promise<RevenueChartData[]> {
    const { startDate, endDate } = this.getDateRange(queryDto);
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const chartData: RevenueChartData[] = [];

    // Generate data points for each day
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [revenue, subscriptions, members] = await Promise.all([
        this.paymentRepository
          .createQueryBuilder('payment')
          .select('COALESCE(SUM(amount), 0)', 'total')
          .where('payer_org_id = :orgId', { orgId: organizationId })
          .andWhere('status = :status', { status: 'success' })
          .andWhere('created_at >= :start', { start: date })
          .andWhere('created_at < :end', { end: nextDate })
          .getRawOne(),
        this.memberSubscriptionRepository.count({
          where: {
            organization_id: organizationId,
            created_at: Between(date, nextDate),
          },
        }),
        this.memberRepository.count({
          where: {
            organization_user: { organization_id: organizationId },
            created_at: Between(date, nextDate),
          },
        }),
      ]);

      chartData.push({
        date: date.toISOString().split('T')[0],
        revenue: parseFloat(revenue.total),
        subscriptions,
        members,
      });
    }

    return chartData;
  }

  // ============================================
  // PLAN PERFORMANCE
  // ============================================
  async getPlanPerformance(
    organizationId: string,
  ): Promise<PlanPerformanceData[]> {
    const plans = await this.memberPlanRepository.find({
      where: { organization_id: organizationId },
      relations: ['subscriptions'],
    });

    const performance: PlanPerformanceData[] = [];

    for (const plan of plans) {
      const activeSubscriptions =
        plan.subscriptions?.filter(
          (sub) => sub.status === SubscriptionStatus.ACTIVE,
        ).length || 0;

      // Calculate revenue from this plan
      const revenueResult = await this.paymentRepository
        .createQueryBuilder('payments')
        .innerJoin('payment.invoice', 'invoices')
        .innerJoin('invoice.member_subscription', 'member_subscriptions')
        .select('COALESCE(SUM(payment.amount), 0)', 'total')
        .where('member_subscriptions.plan_id = :planId', { planId: plan.id })
        .andWhere('payment.status = :status', { status: 'success' })
        .getRawOne();

      // Conversion rate (active / total created)
      const totalSubscriptions = plan.subscriptions?.length || 0;
      const conversionRate =
        totalSubscriptions > 0
          ? (activeSubscriptions / totalSubscriptions) * 100
          : 0;

      performance.push({
        plan_id: plan.id,
        plan_name: plan.name,
        active_subscriptions: activeSubscriptions,
        revenue: parseFloat(revenueResult.total),
        conversion_rate: parseFloat(conversionRate.toFixed(2)),
      });
    }

    // Sort by revenue descending
    return performance.sort((a, b) => b.revenue - a.revenue);
  }

  // ============================================
  // TOP Members
  // ============================================
  async getTopMembers(organizationId: string, limit: number = 10) {
    const topMembers = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.payer_user_id', 'member_id')
      .addSelect('payer_user.first_name', 'first_name')
      .addSelect('payer_user.last_name', 'last_name')
      .addSelect('payer_user.email', 'email')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'total_spent')
      .addSelect('COUNT(payment.id)', 'payment_count')
      .innerJoin('payment.payer_user', 'user')
      .where('payment.payer_org_id = :orgId', { orgId: organizationId })
      .andWhere('payment.status = :status', { status: 'success' })
      .groupBy('payment.payer_user_id')
      .addGroupBy('payer_user_id.first_name')
      .addGroupBy('payer_user_id.last_name')
      .addGroupBy('payer_user_id.email')
      .orderBy('total_spent', 'DESC')
      .limit(limit)
      .getRawMany();

    return topMembers.map((member) => ({
      member_id: member.member_id,
      name: `${member.first_name} ${member.last_name}`,
      email: member.email,
      total_spent: parseFloat(member.total_spent),
      payment_count: parseInt(member.payment_count),
    }));
  }

  // ============================================
  // HELPER METHODS
  // ============================================
  private getDateRange(queryDto: AnalyticsQueryDto): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (
      queryDto.period === TimePeriod.CUSTOM &&
      queryDto.startDate &&
      queryDto.endDate
    ) {
      startDate = new Date(queryDto.startDate);
      endDate = new Date(queryDto.endDate);
    } else {
      switch (queryDto.period) {
        case TimePeriod.TODAY:
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case TimePeriod.WEEK:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case TimePeriod.QUARTER:
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 3);
          break;
        case TimePeriod.YEAR:
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case TimePeriod.MONTH:
        default:
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
    }

    return { startDate, endDate };
  }

  private normalizeToMonthly(
    amount: number,
    interval: string,
    intervalCount: number,
  ): number {
    switch (interval) {
      case 'weekly':
        return (amount * 52) / (12 * intervalCount);
      case 'yearly':
        return amount / (12 * intervalCount);
      case 'monthly':
      default:
        return amount / intervalCount;
    }
  }
}
