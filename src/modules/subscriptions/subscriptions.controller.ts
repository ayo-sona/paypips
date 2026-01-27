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
import {
  MemberSubscription,
  OrganizationSubscription,
} from 'src/database/entities';
import { CurrentOrganization } from 'src/common/decorators/organization.decorator';
import {
  ChangeSubscriptionPlanDto,
  UpdateSubscriptionDto,
} from './dto/update-subscription.dto';
import {
  ChangeOrgSubscriptionPlanDto,
  UpdateOrgSubscriptionStatusDto,
} from './dto/organization-subscription.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('subscriptions')
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
  @Post('/members')
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
  @Get('/members')
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
  @Get('/members/:subscriptionId')
  findOne(
    @CurrentOrganization() organizationId: string,
    @Param('subscriptionId') subscriptionId: string,
  ) {
    return this.subscriptionsService.findOneMemberSubscription(
      organizationId,
      subscriptionId,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel a member subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription canceled successfully',
    type: MemberSubscription,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @Patch('/members/:subscriptionId/cancel')
  cancel(
    @CurrentUser() user: any,
    @CurrentOrganization() organizationId: string,
    @Param('subscriptionId') subscriptionId: string,
  ) {
    return this.subscriptionsService.cancelSubscription(
      subscriptionId,
      user.id,
      organizationId,
    );
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
  @Post('/members/:subscriptionId/renew')
  renew(
    @CurrentOrganization() organizationId: string,
    @Param('subscriptionId') subscriptionId: string,
  ) {
    return this.subscriptionsService.renewMemberSubscription(
      organizationId,
      subscriptionId,
    );
  }

  @Patch('/members/:subscriptionId/status')
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

  @Post('/members/:subscriptionId/change-plan')
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

  //////////////////////////////////////
  // Organization

  @Get('organizations')
  @ApiOperation({ summary: 'Get current organization subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription retrieved successfully',
    type: OrganizationSubscription,
  })
  getCurrentSubscription(@CurrentOrganization() organizationId: string) {
    return this.subscriptionsService.getOrganizationSubscription(
      organizationId,
    );
  }

  @Get('organizations/history')
  @ApiOperation({ summary: 'Get organization subscription history' })
  @ApiResponse({
    status: 200,
    description: 'Subscription history retrieved successfully',
    type: [OrganizationSubscription],
  })
  getSubscriptionHistory(@CurrentOrganization() organizationId: string) {
    return this.subscriptionsService.getOrgSubscriptionHistory(organizationId);
  }

  @Patch('organizations/status')
  @ApiOperation({ summary: 'Update subscription status' })
  @ApiResponse({
    status: 200,
    description: 'Subscription status updated successfully',
  })
  updateOrgStatus(
    @CurrentOrganization() organizationId: string,
    @Body() updateDto: UpdateOrgSubscriptionStatusDto,
  ) {
    return this.subscriptionsService.updateOrgSubscriptionStatus(
      organizationId,
      updateDto,
    );
  }

  @Post('organizations/change-plan')
  @ApiOperation({ summary: 'Change subscription plan' })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan changed successfully',
  })
  changeOrgPlan(
    @CurrentOrganization() organizationId: string,
    @Body() changePlanDto: ChangeOrgSubscriptionPlanDto,
  ) {
    return this.subscriptionsService.changeOrgSubscriptionPlan(
      organizationId,
      changePlanDto,
    );
  }

  @Post('organizations/renew')
  @ApiOperation({ summary: 'Renew subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription renewed successfully',
  })
  renewOrg(@CurrentOrganization() organizationId: string) {
    return this.subscriptionsService.renewOrgSubscription(organizationId);
  }
}
