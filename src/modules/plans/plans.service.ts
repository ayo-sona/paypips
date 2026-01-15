import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberPlan } from '../../database/entities/member-plan.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(MemberPlan)
    private memberPlanRepository: Repository<MemberPlan>,
  ) {}

  async createMemberPlan(organizationId: string, createPlanDto: CreatePlanDto) {
    const plan = this.memberPlanRepository.create({
      organization_id: organizationId,
      name: createPlanDto.name,
      description: createPlanDto.description,
      price: createPlanDto.amount,
      currency: createPlanDto.currency || 'NGN',
      interval: createPlanDto.interval,
      interval_count: createPlanDto.intervalCount || 1,
      features: createPlanDto.features || [],
      is_active: true,
      //   trial_period_days: createPlanDto.trialPeriodDays || 0,
    });

    const saved = await this.memberPlanRepository.save(plan);

    return {
      message: 'Plan created successfully',
      data: saved,
    };
  }

  async findAllMemberPlans(
    organizationId: string,
    paginationDto: PaginationDto,
  ) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [plans, total] = await this.memberPlanRepository.findAndCount({
      where: { organization_id: organizationId },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      message: 'Plans retrieved successfully',
      ...paginate(plans, total, page, limit),
    };
  }

  async findActiveMemberPlans(organizationId: string) {
    const plans = await this.memberPlanRepository.find({
      where: {
        organization_id: organizationId,
        is_active: true,
      },
      order: { price: 'ASC' },
    });

    return {
      message: 'Active plans retrieved successfully',
      data: plans,
    };
  }

  async findMemberPlan(organizationId: string, planId: string) {
    const plan = await this.memberPlanRepository.findOne({
      where: {
        id: planId,
        organization_id: organizationId,
      },
      relations: ['subscriptions'],
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Count active subscriptions
    const activeSubscriptionsCount =
      plan.subscriptions?.filter((sub) => sub.status === 'active').length || 0;

    return {
      message: 'Plan retrieved successfully',
      data: {
        ...plan,
        activeSubscriptionsCount,
      },
    };
  }

  async updateMemberPlan(
    organizationId: string,
    planId: string,
    updatePlanDto: UpdatePlanDto,
  ) {
    const plan = await this.memberPlanRepository.findOne({
      where: {
        id: planId,
        organization_id: organizationId,
      },
      relations: ['subscriptions'],
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Check if plan has active subscriptions
    const hasActiveSubscriptions = plan.subscriptions?.some(
      (sub) => sub.status === 'active',
    );

    // Prevent critical changes if there are active subscriptions
    if (hasActiveSubscriptions) {
      if (
        updatePlanDto.amount !== undefined &&
        updatePlanDto.amount !== plan.price
      ) {
        throw new BadRequestException(
          'Cannot change plan amount while there are active subscriptions. Create a new plan instead.',
        );
      }

      if (updatePlanDto.interval && updatePlanDto.interval !== plan.interval) {
        throw new BadRequestException(
          'Cannot change billing interval while there are active subscriptions. Create a new plan instead.',
        );
      }
    }

    Object.assign(plan, updatePlanDto);
    const updated = await this.memberPlanRepository.save(plan);

    return {
      message: 'Plan updated successfully',
      data: updated,
    };
  }

  async toggleActiveMemberPlan(organizationId: string, planId: string) {
    const plan = await this.memberPlanRepository.findOne({
      where: {
        id: planId,
        organization_id: organizationId,
      },
      relations: ['subscriptions'],
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Check for active subscriptions before deactivating
    if (plan.is_active) {
      const hasActiveSubscriptions = plan.subscriptions?.some(
        (sub) => sub.status === 'active',
      );

      if (hasActiveSubscriptions) {
        throw new BadRequestException(
          'Cannot deactivate plan with active subscriptions',
        );
      }
    }

    plan.is_active = !plan.is_active;
    await this.memberPlanRepository.save(plan);

    return {
      message: `Plan ${plan.is_active ? 'activated' : 'deactivated'} successfully`,
      data: plan,
    };
  }

  async deleteMemberPlan(organizationId: string, planId: string) {
    const plan = await this.memberPlanRepository.findOne({
      where: {
        id: planId,
        organization_id: organizationId,
      },
      relations: ['subscriptions'],
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Check if plan has any subscriptions (active or not)
    if (plan.subscriptions && plan.subscriptions.length > 0) {
      throw new BadRequestException(
        'Cannot delete plan with existing subscriptions. Deactivate it instead.',
      );
    }

    await this.memberPlanRepository.remove(plan);

    return {
      message: 'Plan deleted successfully',
    };
  }
}
