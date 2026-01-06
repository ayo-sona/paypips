import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Subscription } from '../../database/entities/subscription.entity';
import { Customer } from '../../database/entities/customer.entity';
import { Plan } from '../../database/entities/plan.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { generateInvoiceNumber } from '../../common/utils/invoice-number.util';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
  ) {}

  async create(
    organizationId: string,
    createSubscriptionDto: CreateSubscriptionDto,
  ) {
    // Verify customer belongs to organization
    const customer = await this.customerRepository.findOne({
      where: {
        id: createSubscriptionDto.customerId,
        organization_id: organizationId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Verify plan belongs to organization and is active
    const plan = await this.planRepository.findOne({
      where: {
        id: createSubscriptionDto.planId,
        organization_id: organizationId,
        is_active: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found or inactive');
    }

    // Check if customer already has an active subscription to this plan
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: {
        customer_id: createSubscriptionDto.customerId,
        plan_id: createSubscriptionDto.planId,
        status: 'active',
      },
    });

    if (existingSubscription) {
      throw new BadRequestException(
        'Customer already has an active subscription to this plan',
      );
    }

    // Calculate period dates
    const now = new Date();
    const periodEnd = this.calculatePeriodEnd(
      now,
      plan.interval,
      plan.interval_count,
    );
    const trialEnd =
      plan.trial_period_days > 0
        ? new Date(now.getTime() + plan.trial_period_days * 24 * 60 * 60 * 1000)
        : null;

    // Create subscription
    const subscription = this.subscriptionRepository.create({
      organization_id: organizationId,
      customer_id: createSubscriptionDto.customerId,
      plan_id: createSubscriptionDto.planId,
      status: trialEnd ? 'trialing' : 'active',
      current_period_start: now,
      current_period_end: periodEnd,
      trial_end: trialEnd,
      metadata: createSubscriptionDto.metadata || {},
    });

    const savedSubscription =
      await this.subscriptionRepository.save(subscription);

    // Create first invoice (only if no trial or trial has ended)
    if (!trialEnd) {
      await this.createInvoiceForSubscription(
        organizationId,
        savedSubscription,
        plan,
        customer,
      );
    }

    return {
      message: 'Subscription created successfully',
      data: await this.subscriptionRepository.findOne({
        where: { id: savedSubscription.id },
        relations: ['customer', 'plan'],
      }),
    };
  }

  async findAll(
    organizationId: string,
    paginationDto: PaginationDto,
    status?: string,
  ) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const whereCondition: any = { organization_id: organizationId };
    if (status) {
      whereCondition.status = status;
    }

    const [subscriptions, total] =
      await this.subscriptionRepository.findAndCount({
        where: whereCondition,
        relations: ['customer', 'plan'],
        order: { created_at: 'DESC' },
        skip,
        take: limit,
      });

    return {
      message: 'Subscriptions retrieved successfully',
      ...paginate(subscriptions, total, page, limit),
    };
  }

  async findOne(organizationId: string, subscriptionId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        id: subscriptionId,
        organization_id: organizationId,
      },
      relations: ['customer', 'plan', 'invoices'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return {
      message: 'Subscription retrieved successfully',
      data: subscription,
    };
  }

  async pause(organizationId: string, subscriptionId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        id: subscriptionId,
        organization_id: organizationId,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== 'active') {
      throw new BadRequestException('Only active subscriptions can be paused');
    }

    subscription.status = 'paused';
    await this.subscriptionRepository.save(subscription);

    return {
      message: 'Subscription paused successfully',
      data: subscription,
    };
  }

  async resume(organizationId: string, subscriptionId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        id: subscriptionId,
        organization_id: organizationId,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== 'paused') {
      throw new BadRequestException('Only paused subscriptions can be resumed');
    }

    subscription.status = 'active';
    await this.subscriptionRepository.save(subscription);

    return {
      message: 'Subscription resumed successfully',
      data: subscription,
    };
  }

  async cancel(organizationId: string, subscriptionId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        id: subscriptionId,
        organization_id: organizationId,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (
      subscription.status === 'canceled' ||
      subscription.status === 'expired'
    ) {
      throw new BadRequestException('Subscription already canceled or expired');
    }

    subscription.status = 'canceled';
    subscription.canceled_at = new Date();
    subscription.ended_at = new Date();
    await this.subscriptionRepository.save(subscription);

    return {
      message: 'Subscription canceled successfully',
      data: subscription,
    };
  }

  async renewSubscription(subscriptionId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan', 'customer', 'organization'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== 'active') {
      throw new BadRequestException('Only active subscriptions can be renewed');
    }

    // Update period dates
    const newPeriodStart = subscription.current_period_end;
    const newPeriodEnd = this.calculatePeriodEnd(
      newPeriodStart,
      subscription.plan.interval,
      subscription.plan.interval_count,
    );

    subscription.current_period_start = newPeriodStart;
    subscription.current_period_end = newPeriodEnd;

    await this.subscriptionRepository.save(subscription);

    // Create new invoice for the renewed period
    await this.createInvoiceForSubscription(
      subscription.organization_id,
      subscription,
      subscription.plan,
      subscription.customer,
    );

    return {
      message: 'Subscription renewed successfully',
      data: subscription,
    };
  }

  // Helper method to check and expire subscriptions (should be run by a cron job)
  async checkExpiredSubscriptions() {
    const now = new Date();

    const expiredSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: 'active',
        current_period_end: LessThan(now),
      },
    });

    for (const subscription of expiredSubscriptions) {
      subscription.status = 'expired';
      subscription.ended_at = now;
      await this.subscriptionRepository.save(subscription);
    }

    return {
      message: `${expiredSubscriptions.length} subscriptions expired`,
      count: expiredSubscriptions.length,
    };
  }

  // Helper method to check and convert trialing subscriptions to active
  async checkTrialingSubscriptions() {
    const now = new Date();

    const trialEndedSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: 'trialing',
        trial_end: LessThan(now),
      },
      relations: ['plan', 'customer'],
    });

    for (const subscription of trialEndedSubscriptions) {
      subscription.status = 'active';
      await this.subscriptionRepository.save(subscription);

      // Create first invoice after trial
      await this.createInvoiceForSubscription(
        subscription.organization_id,
        subscription,
        subscription.plan,
        subscription.customer,
      );
    }

    return {
      message: `${trialEndedSubscriptions.length} trials converted to active`,
      count: trialEndedSubscriptions.length,
    };
  }

  private async createInvoiceForSubscription(
    organizationId: string,
    subscription: Subscription,
    plan: Plan,
    customer: Customer,
  ) {
    const invoice = this.invoiceRepository.create({
      organization_id: organizationId,
      subscription_id: subscription.id,
      customer_id: customer.id,
      invoice_number: generateInvoiceNumber(organizationId),
      amount: plan.amount,
      currency: plan.currency,
      status: 'pending',
      due_date: subscription.current_period_end,
      metadata: {
        plan_name: plan.name,
        billing_period: {
          start: subscription.current_period_start,
          end: subscription.current_period_end,
        },
      },
    });

    return await this.invoiceRepository.save(invoice);
  }

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
}
