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

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

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

  @Get(':id')
  findOne(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.subscriptionsService.findOne(organizationId, id);
  }

  @Patch(':id/pause')
  pause(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.subscriptionsService.pause(organizationId, id);
  }

  @Patch(':id/resume')
  resume(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.subscriptionsService.resume(organizationId, id);
  }

  @Patch(':id/cancel')
  cancel(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.subscriptionsService.cancel(organizationId, id);
  }

  @Post(':id/renew')
  renew(@Param('id') id: string) {
    return this.subscriptionsService.renewSubscription(id);
  }
}
