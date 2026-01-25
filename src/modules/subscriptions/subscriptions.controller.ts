import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FindAllMemberSubscriptionsDto } from './dto/find-all-subscriptions.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MemberSubscription } from 'src/database/entities';
import { CurrentOrganization } from 'src/common/decorators/organization.decorator';
import {
  ChangeSubscriptionPlanDto,
  UpdateSubscriptionDto,
} from './dto/update-subscription.dto';

@Controller('members/subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new member subscription' })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
    type: MemberSubscription,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 409, description: 'Subscription already exists' })
  @Post()
  create(
    @CurrentOrganization() organizationId: string,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.createMemberSubscription(
      organizationId,
      createSubscriptionDto,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all member subscriptions' })
  @ApiResponse({
    status: 200,
    description: 'Subscriptions retrieved successfully',
    content: {
      'application/json': {
        example: {
          data: [MemberSubscription],
          meta: {
            page: 1,
            limit: 10,
            total: 100,
            totalPages: 10,
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Get()
  findAll(
    @CurrentOrganization() organizationId: string,
    @Query() findAllMemberSubscriptionsDto: FindAllMemberSubscriptionsDto,
  ) {
    // console.log('findAllMemberSubscriptionsDto', findAllMemberSubscriptionsDto);
    return this.subscriptionsService.findAllMemberSubscriptions(
      organizationId,
      findAllMemberSubscriptionsDto,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a member subscription by ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription retrieved successfully',
    type: MemberSubscription,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @Get(':subscriptionId')
  findOne(
    @CurrentOrganization() organizationId: string,
    @Param('subscriptionId') subscriptionId: string,
  ) {
    return this.subscriptionsService.findOneMemberSubscription(
      organizationId,
      subscriptionId,
    );
  }

  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Pause a member subscription' })
  // @ApiResponse({ status: 200, description: 'Subscription paused successfully' })
  // @ApiResponse({ status: 400, description: 'Bad Request' })
  // @ApiResponse({ status: 404, description: 'Subscription not found' })
  // @Patch('/:subscriptionId/pause')
  // pause(
  //   @CurrentOrganization() organizationId: string,
  //   @Param('subscriptionId') subscriptionId: string,
  // ) {
  //   return this.subscriptionsService.pause(organizationId, subscriptionId);
  // }

  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Resume a member subscription' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Subscription resumed successfully',
  //   type: MemberSubscription,
  // })
  // @ApiResponse({ status: 400, description: 'Bad Request' })
  // @ApiResponse({ status: 404, description: 'Subscription not found' })
  // @Patch('/:subscriptionId/resume')
  // resume(
  //   @CurrentOrganization() organizationId: string,
  //   @Param('subscriptionId') subscriptionId: string,
  // ) {
  //   return this.subscriptionsService.resume(organizationId, subscriptionId);
  // }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel a member subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription canceled successfully',
    type: MemberSubscription,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @Patch('/:subscriptionId/cancel')
  cancel(
    @CurrentOrganization() organizationId: string,
    @Param('subscriptionId') subscriptionId: string,
  ) {
    return this.subscriptionsService.cancel(organizationId, subscriptionId);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Renew a member subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription renewed successfully',
    type: MemberSubscription,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @Post('/:subscriptionId/renew')
  renew(
    @CurrentOrganization() organizationId: string,
    @Param('subscriptionId') subscriptionId: string,
  ) {
    return this.subscriptionsService.renewMemberSubscription(
      organizationId,
      subscriptionId,
    );
  }

  @Patch(':subscriptionId/status')
  @ApiOperation({ summary: 'Update subscription status' })
  @ApiResponse({
    status: 200,
    description: 'Subscription status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async updateStatus(
    @CurrentOrganization() organizationId: string,
    @Param('subscriptionId') subscriptionId: string,
    @Body() updateDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.updateSubscriptionStatus(
      organizationId,
      subscriptionId,
      updateDto,
    );
  }

  @Post(':subscriptionId/change-plan')
  @ApiOperation({ summary: 'Change subscription plan' })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan changed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription or new plan not found',
  })
  async changePlan(
    @CurrentOrganization() organizationId: string,
    @Param('subscriptionId') subscriptionId: string,
    @Body() changePlanDto: ChangeSubscriptionPlanDto,
  ) {
    return this.subscriptionsService.changeSubscriptionPlan(
      organizationId,
      subscriptionId,
      changePlanDto,
    );
  }
}
