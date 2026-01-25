import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Member } from '../../database/entities/member.entity';
import { Invoice, InvoiceStatus } from '../../database/entities/invoice.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { paginate } from '../../common/dto/pagination.dto';
import { generateInvoiceNumber } from '../../common/utils/invoice-number.util';
import { MemberSubscription } from '../../database/entities/member-subscription.entity';
import { MemberPlan } from '../../database/entities/member-plan.entity';
import { FindAllMemberSubscriptionsDto } from './dto/find-all-subscriptions.dto';
import { addMonths } from 'date-fns';
import {
  ChangeSubscriptionPlanDto,
  UpdateSubscriptionDto,
} from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(MemberSubscription)
    private memberSubscriptionRepository: Repository<MemberSubscription>,

    @InjectRepository(Member)
    private memberRepository: Repository<Member>,

    @InjectRepository(MemberPlan)
    private memberPlanRepository: Repository<MemberPlan>,

    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
  ) {}

  async createMemberSubscription(
    organizationId: string,
    createSubscriptionDto: CreateSubscriptionDto,
  ) {
    // Verify member belongs to organization
    const member = await this.memberRepository.findOne({
      where: {
        id: createSubscriptionDto.memberId,
        organization_user: {
          organization_id: organizationId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Verify plan belongs to organization and is active
    const plan = await this.memberPlanRepository.findOne({
      where: {
        id: createSubscriptionDto.planId,
        organization_id: organizationId,
        is_active: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found or inactive');
    }

    // Check if member already has an active subscription to this plan
    const existingSubscription =
      await this.memberSubscriptionRepository.findOne({
        where: {
          member_id: createSubscriptionDto.memberId,
          plan_id: createSubscriptionDto.planId,
          status: 'active',
        },
      });

    if (existingSubscription) {
      throw new BadRequestException(
        'Member already has an active subscription to this plan',
      );
    }

    // Calculate period dates
    const now = new Date();
    const periodEnd = this.calculatePeriodEnd(
      now,
      plan.interval,
      plan.interval_count,
    );
    // const trialEnd =
    //   plan.trial_period_days > 0
    //     ? new Date(now.getTime() + plan.trial_period_days * 24 * 60 * 60 * 1000)
    //     : null;

    // Create subscription
    const subscription = this.memberSubscriptionRepository.create({
      member_id: createSubscriptionDto.memberId,
      plan_id: createSubscriptionDto.planId,
      status: 'active',
      started_at: now,
      expires_at: periodEnd,
      metadata: createSubscriptionDto.metadata || {},
    });

    const savedSubscription: MemberSubscription =
      await this.memberSubscriptionRepository.save(subscription);

    console.log('sub', savedSubscription);
    // Create first invoice (only if no trial or trial has ended)
    // if (!trialEnd) {
    //   await this.createInvoiceForSubscription(
    //     organizationId,
    //     savedSubscription,
    //     plan,
    //     member,
    //   );
    // }

    return {
      message: 'Subscription created successfully',
      data: await this.memberSubscriptionRepository.findOne({
        where: { id: savedSubscription.id },
        relations: ['member', 'plan'],
      }),
    };
  }

  async findAllMemberSubscriptions(
    organizationId: string,
    findAllMemberSubscriptionsDto: FindAllMemberSubscriptionsDto,
  ) {
    const { page = 1, limit = 10 } = findAllMemberSubscriptionsDto;
    const skip = (page - 1) * limit;

    const whereCondition: any = { organization_id: organizationId };
    if (findAllMemberSubscriptionsDto.status) {
      whereCondition.status = findAllMemberSubscriptionsDto.status;
    }

    const [subscriptions, total] =
      await this.memberSubscriptionRepository.findAndCount({
        where: whereCondition,
        relations: ['member', 'plan'],
        order: { created_at: 'DESC' },
        skip,
        take: limit,
      });

    // console.log('subscriptions', subscriptions);

    return {
      message: 'Subscriptions retrieved successfully',
      ...paginate(subscriptions, total, page, limit),
    };
  }

  async findOneMemberSubscription(
    organizationId: string,
    subscriptionId: string,
  ) {
    const subscription = await this.memberSubscriptionRepository.findOne({
      where: {
        id: subscriptionId,
        organization_id: organizationId,
      },
      relations: ['member', 'member.user', 'plan'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return {
      message: 'Subscription retrieved successfully',
      data: subscription,
    };
  }

  // async pause(organizationId: string, subscriptionId: string) {
  //   const subscription = await this.memberSubscriptionRepository.findOne({
  //     where: {
  //       id: subscriptionId,
  //       organization_id: organizationId,
  //     },
  //   });

  //   if (!subscription) {
  //     throw new NotFoundException('Subscription not found');
  //   }

  //   if (subscription.status !== 'active') {
  //     throw new BadRequestException('Only active subscriptions can be paused');
  //   }

  //   subscription.status = 'paused';
  //   await this.memberSubscriptionRepository.save(subscription);

  //   return {
  //     message: 'Subscription paused successfully',
  //     data: subscription,
  //   };
  // }

  // async resume(organizationId: string, subscriptionId: string) {
  //   const subscription = await this.memberSubscriptionRepository.findOne({
  //     where: {
  //       id: subscriptionId,
  //       organization_id: organizationId,
  //     },
  //   });

  //   if (!subscription) {
  //     throw new NotFoundException('Subscription not found');
  //   }

  //   if (subscription.status !== 'paused') {
  //     throw new BadRequestException('Only paused subscriptions can be resumed');
  //   }

  //   subscription.status = 'active';
  //   await this.memberSubscriptionRepository.save(subscription);

  //   return {
  //     message: 'Subscription resumed successfully',
  //     data: subscription,
  //   };
  // }

  async updateSubscriptionStatus(
    organizationId: string,
    subscriptionId: string,
    updateDto: UpdateSubscriptionDto,
  ) {
    const subscription = await this.memberSubscriptionRepository.findOne({
      where: {
        id: subscriptionId,
        organization_id: organizationId,
      },
      relations: ['plan', 'member'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // If activating an inactive subscription, update the dates
    if (updateDto.status === 'active' && subscription.status !== 'active') {
      const now = new Date();
      subscription.started_at = now;
      subscription.expires_at = addMonths(
        now,
        subscription.plan.interval_count,
      );
      subscription.canceled_at = new Date();
    }
    // If canceling an active subscription
    else if (
      updateDto.status === 'canceled' &&
      subscription.status === 'active'
    ) {
      subscription.canceled_at = new Date();
    }
    subscription.status = updateDto.status as string;
    subscription.metadata = updateDto.metadata || subscription.metadata;
    const updated = await this.memberSubscriptionRepository.save(subscription);

    return {
      message: 'Subscription status updated successfully',
      data: updated,
    };
  }

  async changeSubscriptionPlan(
    organizationId: string,
    subscriptionId: string,
    changePlanDto: ChangeSubscriptionPlanDto,
  ) {
    // Start a transaction
    return this.memberSubscriptionRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Get the current subscription
        const currentSubscription = await transactionalEntityManager.findOne(
          MemberSubscription,
          {
            where: {
              id: subscriptionId,
              organization_id: organizationId,
            },
            relations: ['plan'],
          },
        );
        if (!currentSubscription) {
          throw new NotFoundException('Subscription not found');
        }
        // Get the new plan
        const newPlan = await transactionalEntityManager.findOne(MemberPlan, {
          where: {
            id: changePlanDto.newPlanId,
            organization_id: organizationId,
          },
        });
        if (!newPlan) {
          throw new NotFoundException('New plan not found');
        }
        // Create a new subscription with the new plan
        const newSubscription = this.memberSubscriptionRepository.create({
          member_id: currentSubscription.member_id,
          plan_id: newPlan.id,
          organization_id: organizationId,
          status: 'active',
          started_at: new Date(),
          expires_at: addMonths(new Date(), newPlan.interval_count),
          auto_renew: currentSubscription.auto_renew,
          metadata: {
            ...currentSubscription.metadata,
            previous_plan_id: currentSubscription.plan_id,
            changed_at: new Date(),
            ...changePlanDto.metadata,
          },
        });
        // Save the new subscription
        const createdSubscription =
          await transactionalEntityManager.save(newSubscription);
        // Cancel the old subscription
        currentSubscription.status = 'canceled';
        currentSubscription.canceled_at = new Date();
        currentSubscription.metadata = {
          ...currentSubscription.metadata,
          ...changePlanDto.metadata,
          notes:
            `Plan changed to ${newPlan.name}. ${changePlanDto?.metadata || ''}`.trim(),
        };

        await transactionalEntityManager.save(currentSubscription);
        return {
          message: 'Subscription plan changed successfully',
          data: createdSubscription,
        };
      },
    );
  }

  async cancel(organizationId: string, subscriptionId: string) {
    const subscription = await this.memberSubscriptionRepository.findOne({
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
    await this.memberSubscriptionRepository.save(subscription);

    return {
      message: 'Subscription canceled successfully',
      data: subscription,
    };
  }

  async renewMemberSubscription(
    organizationId: string,
    subscriptionId: string,
  ) {
    const subscription = await this.memberSubscriptionRepository.findOne({
      where: { id: subscriptionId, organization_id: organizationId },
      relations: ['plan', 'member', 'organization'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== 'active') {
      throw new BadRequestException('Only active subscriptions can be renewed');
    }

    // Update period dates
    const newPeriodStart = subscription.expires_at;
    const newPeriodEnd = this.calculatePeriodEnd(
      newPeriodStart,
      subscription.plan.interval,
      subscription.plan.interval_count,
    );

    subscription.started_at = newPeriodStart;
    subscription.expires_at = newPeriodEnd;

    await this.memberSubscriptionRepository.save(subscription);

    // Create new invoice for the renewed period
    await this.createInvoiceForSubscription(
      organizationId,
      subscription,
      subscription.member,
    );

    return {
      message: 'Subscription renewed successfully',
      data: subscription,
    };
  }

  // Helper method to check and expire subscriptions (should be run by a cron job)
  async checkExpiredSubscriptions() {
    const now = new Date();

    const expiredSubscriptions = await this.memberSubscriptionRepository.find({
      where: {
        status: 'active',
        expires_at: LessThan(now),
      },
    });

    for (const subscription of expiredSubscriptions) {
      subscription.status = 'expired';
      await this.memberSubscriptionRepository.save(subscription);
    }

    return {
      message: `${expiredSubscriptions.length} subscriptions expired`,
      count: expiredSubscriptions.length,
    };
  }

  // Helper method to check and convert trialing subscriptions to active
  //   async checkTrialingSubscriptions() {
  //     const now = new Date();

  //     const trialEndedSubscriptions =
  //       await this.memberSubscriptionRepository.find({
  //         where: {
  //           status: 'trialing',
  //           trial_end: LessThan(now),
  //         },
  //         relations: ['plan', 'member'],
  //       });

  //     for (const subscription of trialEndedSubscriptions) {
  //       subscription.status = 'active';
  //       await this.memberSubscriptionRepository.save(subscription);

  //       // Create first invoice after trial
  //       await this.createInvoiceForSubscription(
  //         subscription.organization_id,
  //         subscription,
  //         subscription.plan,
  //         subscription.member,
  //       );
  //     }

  //     return {
  //       message: `${trialEndedSubscriptions.length} trials converted to active`,
  //       count: trialEndedSubscriptions.length,
  //     };
  //   }

  private async createInvoiceForSubscription(
    organizationId: string,
    subscription: MemberSubscription,
    member: Member,
  ) {
    const invoice = this.invoiceRepository.create({
      issuer_org_id: organizationId,
      member_subscription_id: subscription.id,
      billed_user_id: member.user.id,
      invoice_number: generateInvoiceNumber(organizationId),
      amount: subscription.plan.price,
      currency: subscription.plan.currency,
      status: InvoiceStatus.PENDING,
      due_date: subscription.expires_at,
      metadata: {
        plan_name: subscription.plan.name,
        billing_period: {
          start: subscription.created_at,
          end: subscription.expires_at,
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
