import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Member } from '../../database/entities/member.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import {
  InvoiceBilledType,
  InvoiceStatus,
  SubscriptionStatus,
} from 'src/common/enums/enums';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { paginate } from '../../common/dto/pagination.dto';
import { generateInvoiceNumber } from '../../common/utils/invoice-number.util';
import { MemberSubscription } from '../../database/entities/member-subscription.entity';
import { MemberPlan } from '../../database/entities/member-plan.entity';
import { FindAllMemberSubscriptionsDto } from './dto/find-all-subscriptions.dto';
import { addMonths, isAfter } from 'date-fns';
import {
  Organization,
  OrganizationSubscription,
  OrganizationUser,
} from 'src/database/entities';
import {
  ChangeSubscriptionPlanDto,
  UpdateSubscriptionDto,
} from './dto/update-subscription.dto';
import {
  ChangeOrgSubscriptionPlanDto,
  UpdateOrgSubscriptionStatusDto,
} from './dto/organization-subscription.dto';
import { OrganizationPlan } from 'src/database/entities';
import { PaystackService } from '../payments/paystack.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(MemberSubscription)
    private memberSubscriptionRepository: Repository<MemberSubscription>,

    @InjectRepository(OrganizationSubscription)
    private organizationSubscriptionRepository: Repository<OrganizationSubscription>,

    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,

    @InjectRepository(OrganizationPlan)
    private organizationPlanRepository: Repository<OrganizationPlan>,

    @InjectRepository(OrganizationUser)
    private organizationUserRepository: Repository<OrganizationUser>,

    @InjectRepository(Member)
    private memberRepository: Repository<Member>,

    @InjectRepository(MemberPlan)
    private memberPlanRepository: Repository<MemberPlan>,

    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,

    private paystackService: PaystackService,
    private notificationsService: NotificationsService,
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

    // Generate invoice for subscription
    await this.createInvoiceForSubscription(
      organizationId,
      savedSubscription,
      member,
    );

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

  /**
   * Cancel subscription - stops recurring billing
   */
  async cancelSubscription(
    subscriptionId: string,
    userId: string,
    organizationId: string,
  ) {
    const subscription = await this.memberSubscriptionRepository.findOne({
      where: { id: subscriptionId, organization_id: organizationId },
      relations: ['member', 'member.user'],
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

    // Get organization user
    const orgUser = await this.organizationUserRepository.findOne({
      where: {
        organization_id: organizationId,
        user_id: subscription.member.user_id,
      },
    });

    // Deactivate Paystack authorization
    if (orgUser?.paystack_authorization_code) {
      await this.paystackService.deactivateAuthorization(
        orgUser.paystack_authorization_code,
      );

      // Clear authorization from database
      orgUser.paystack_authorization_code = null;
      orgUser.paystack_card_last4 = null;
      orgUser.paystack_card_brand = null;
      await this.organizationUserRepository.save(orgUser);
    }

    // Update subscription
    subscription.auto_renew = false;
    subscription.status = SubscriptionStatus.CANCELED;
    subscription.canceled_at = new Date();

    await this.memberSubscriptionRepository.save(subscription);

    // Send cancellation email
    await this.notificationsService.sendSubscriptionCanceledNotification({
      email: subscription.member.user.email,
      memberName: `${subscription.member.user.first_name} ${subscription.member.user.last_name}`,
      subscriptionName: subscription.plan.name,
      expiresAt: subscription.expires_at,
    });

    return {
      message: 'Subscription canceled successfully',
      data: subscription,
    };
  }

  /**
   * Reactivate subscription if it has been cancelled or expired
   */
  async reactivateSubscription(subscriptionId: string, userId: string) {
    const subscription = await this.memberSubscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['member', 'member.user', 'plan'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.auto_renew = true;
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.canceled_at = null;

    await this.memberSubscriptionRepository.save(subscription);

    return {
      message: 'Subscription reactivated successfully',
      data: subscription,
    };
  }

  /**
   * Renew member subscription on the day it expires
   */

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
    // subscription.status = SubscriptionStatus.ACTIVE
    await this.memberSubscriptionRepository.save(subscription);

    // Send success notification
    await this.notificationsService.sendSubscriptionRenewedNotification({
      email: subscription.member.user.email,
      memberName: `${subscription.member.user.first_name} ${subscription.member.user.last_name}`,
      subscriptionName: subscription.plan.name,
      amount: subscription.plan.price,
      currency: subscription.plan.currency,
      nextBillingDate: subscription.expires_at,
    });

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

  async createOrgSubscription(organizationId: string, planId: string) {
    // 1. Verify organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // 2. Verify plan exists and is an enterprise plan
    const plan = await this.organizationPlanRepository.findOne({
      where: {
        id: planId,
        is_active: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('Enterprise plan not found or inactive');
    }

    // 3. Check for existing active subscription
    const existingSubscription = await this.organizationSubscriptionRepository
      .createQueryBuilder('sub')
      .where('sub.organization_id = :orgId', { orgId: organizationId })
      .andWhere('sub.status = :status', { status: SubscriptionStatus.ACTIVE })
      .andWhere('sub.expires_at > :now', { now: new Date() })
      .getOne();

    if (existingSubscription) {
      throw new BadRequestException(
        'Organization already has an active subscription',
      );
    }

    // 4. Calculate subscription period
    const now = new Date();
    const expiresAt = this.calculatePeriodEnd(
      now,
      plan.interval,
      plan.interval_count,
    );

    // 5. Create subscription record
    const subscription = this.organizationSubscriptionRepository.create({
      organization_id: organizationId,
      plan_id: plan.id,
      status: SubscriptionStatus.PENDING,
      started_at: now,
      expires_at: expiresAt,
    });

    // 6. Save subscription
    const savedSubscription =
      await this.organizationSubscriptionRepository.save(subscription);

    // 7. Create initial invoice
    const invoice = this.invoiceRepository.create({
      issuer_org_id: organizationId,
      organization_subscription_id: subscription.id,
      invoice_number: `INV-${Date.now()}-${organizationId.substring(0, 8)}`,
      billed_type: InvoiceBilledType.ORGANIZATION,
      amount: plan.price,
      currency: plan.currency,
      status: InvoiceStatus.PENDING,
      due_date: subscription.started_at,
      metadata: {
        plan_name: plan.name,
        interval: plan.interval,
        interval_count: plan.interval_count,
      },
    });
    await this.invoiceRepository.save(invoice);

    // 9. Send confirmation email
    await this.notificationsService.sendSubscriptionCreatedNotification({
      email: organization.email,
      memberName: organization.name,
      planName: plan.name,
      amount: plan.price,
      currency: plan.currency,
      interval: plan.interval,
      startDate: now,
      nextBilling: expiresAt,
    });

    return {
      message: 'Enterprise subscription created successfully',
      data: {
        subscription: savedSubscription,
        invoice,
      },
    };
  }

  // Get organization subscription
  async getOrganizationSubscription(organizationId: string) {
    const subscription = await this.organizationSubscriptionRepository.findOne({
      where: { organization_id: organizationId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });
    if (!subscription) {
      throw new NotFoundException(
        'No subscription found for this organization',
      );
    }
    return subscription;
  }

  // Update subscription status
  async updateOrgSubscriptionStatus(
    organizationId: string,
    updateDto: UpdateOrgSubscriptionStatusDto,
  ) {
    const subscription = await this.getOrganizationSubscription(organizationId);

    // Handle status transitions
    if (updateDto.status === SubscriptionStatus.CANCELED) {
      subscription.status = SubscriptionStatus.CANCELED;
      subscription.canceled_at = new Date();
    } else if (
      updateDto.status === SubscriptionStatus.ACTIVE ||
      updateDto.status === SubscriptionStatus.PENDING
    ) {
      // Only allow reactivation if subscription is not expired
      if (subscription.status === SubscriptionStatus.EXPIRED) {
        throw new BadRequestException(
          'Expired subscriptions cannot be reactivated. Please renew instead.',
        );
      }
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.canceled_at = null;
    } else {
      subscription.status = updateDto.status;
    }
    return this.organizationSubscriptionRepository.save(subscription);
  }

  // Change organization subscription plan
  async changeOrgSubscriptionPlan(
    organizationId: string,
    changePlanDto: ChangeOrgSubscriptionPlanDto,
  ) {
    const [subscription, newPlan] = await Promise.all([
      this.getOrganizationSubscription(organizationId),
      this.organizationPlanRepository.findOne({
        where: { id: changePlanDto.newPlanId },
      }),
    ]);

    if (!newPlan) {
      throw new NotFoundException('Plan not found');
    }

    // Create a new subscription with the new plan
    const newSubscription = this.organizationSubscriptionRepository.create({
      organization_id: organizationId,
      plan_id: newPlan.id,
      status: SubscriptionStatus.ACTIVE,
      started_at: new Date(),
      expires_at: this.calculatePeriodEnd(
        new Date(),
        newPlan.interval,
        newPlan.interval_count,
      ),
      metadata: {
        previous_plan_id: subscription.plan_id,
        change_notes: changePlanDto.notes,
      },
    });

    // Cancel the old subscription
    subscription.status = SubscriptionStatus.CANCELED;
    subscription.canceled_at = new Date();
    await this.organizationSubscriptionRepository.save([
      subscription,
      newSubscription,
    ]);
    return newSubscription;
  }

  // Renew organization subscription
  async renewOrgSubscription(organizationId: string) {
    const subscription = await this.getOrganizationSubscription(organizationId);

    if (
      subscription.status === SubscriptionStatus.ACTIVE &&
      isAfter(subscription.expires_at, new Date())
    ) {
      throw new BadRequestException('Subscription is still active');
    }

    // Update period dates
    const newPeriodStart = subscription.expires_at;
    const newPeriodEnd = this.calculatePeriodEnd(
      newPeriodStart,
      subscription.plan.interval,
      subscription.plan.interval_count,
    );

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.started_at = newPeriodStart;
    subscription.expires_at = newPeriodEnd;
    subscription.canceled_at = null;
    return this.organizationSubscriptionRepository.save(subscription);
  }

  // Get organization subscription history
  async getOrgSubscriptionHistory(organizationId: string) {
    return this.organizationSubscriptionRepository.find({
      where: { organization_id: organizationId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });
  }

  // Helper methods
  private async createInvoiceForSubscription(
    organizationId: string,
    subscription: MemberSubscription,
    member: Member,
  ) {
    const invoice = this.invoiceRepository.create({
      issuer_org_id: organizationId,
      member_subscription_id: subscription.id,
      billed_user_id: member.user.id,
      billed_type: InvoiceBilledType.USER,
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
