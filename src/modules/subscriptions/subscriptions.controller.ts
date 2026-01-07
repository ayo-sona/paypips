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
import { CurrentOrganization } from '../../common/decorators/organization.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Subscription } from 'src/database/entities';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
    type: Subscription,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 409, description: 'Subscription already exists' })
  @Post()
  create(
    @CurrentOrganization() organizationId: string,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.create(
      organizationId,
      createSubscriptionDto,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all subscriptions' })
  @ApiResponse({
    status: 200,
    description: 'Subscriptions retrieved successfully',
    content: {
      'application/json': {
        example: {
          data: [Subscription],
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
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.subscriptionsService.findAll(
      organizationId,
      paginationDto,
      status,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a subscription by ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription retrieved successfully',
    type: Subscription,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @Get(':id')
  findOne(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.subscriptionsService.findOne(organizationId, id);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Pause a subscription' })
  @ApiResponse({ status: 200, description: 'Subscription paused successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @Patch(':id/pause')
  pause(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.subscriptionsService.pause(organizationId, id);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Resume a subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription resumed successfully',
    type: Subscription,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @Patch(':id/resume')
  resume(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.subscriptionsService.resume(organizationId, id);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription canceled successfully',
    type: Subscription,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @Patch(':id/cancel')
  cancel(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.subscriptionsService.cancel(organizationId, id);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Renew a subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription renewed successfully',
    type: Subscription,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @Post(':id/renew')
  renew(@Param('id') id: string) {
    return this.subscriptionsService.renewSubscription(id);
  }
}
