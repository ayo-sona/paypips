import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentOrganization } from '../../common/decorators/organization.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Plan } from 'src/database/entities';

@Controller('plans')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new plan' })
  @ApiResponse({
    status: 201,
    description: 'Plan created successfully',
    type: Plan,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  create(
    @CurrentOrganization() organizationId: string,
    @Body() createPlanDto: CreatePlanDto,
  ) {
    return this.plansService.createMemberPlan(organizationId, createPlanDto);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all plans' })
  @ApiResponse({
    status: 200,
    description: 'Plans retrieved successfully',
    content: {
      'application/json': {
        example: {
          data: [Plan],
          meta: {
            page: 1,
            limit: 10,
            total: 10,
            totalPages: 1,
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  findAll(
    @CurrentOrganization() organizationId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.plansService.findAllMemberPlans(organizationId, paginationDto);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get active plans' })
  @ApiResponse({
    status: 200,
    description: 'Active plans retrieved successfully',
    type: Plan['string'],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('active')
  findActive(@CurrentOrganization() organizationId: string) {
    return this.plansService.findActiveMemberPlans(organizationId);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a plan by ID' })
  @ApiResponse({
    status: 200,
    description: 'Plan retrieved successfully',
    type: Plan,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @Get(':id')
  findOne(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.plansService.findMemberPlan(organizationId, id);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a plan' })
  @ApiResponse({
    status: 200,
    description: 'Plan updated successfully',
    type: Plan,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @Put(':id')
  update(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
  ) {
    return this.plansService.updateMemberPlan(
      organizationId,
      id,
      updatePlanDto,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle plan activation' })
  @ApiResponse({
    status: 200,
    description: 'Plan activation toggled successfully',
    type: Plan,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @Patch(':id/toggle')
  toggleActive(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.plansService.toggleActiveMemberPlan(organizationId, id);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a plan' })
  @ApiResponse({ status: 200, description: 'Plan deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @Delete(':id')
  delete(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.plansService.deleteMemberPlan(organizationId, id);
  }
}
