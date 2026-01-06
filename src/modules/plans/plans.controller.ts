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

@Controller('plans')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  create(
    @CurrentOrganization() organizationId: string,
    @Body() createPlanDto: CreatePlanDto,
  ) {
    return this.plansService.create(organizationId, createPlanDto);
  }

  @Get()
  findAll(
    @CurrentOrganization() organizationId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.plansService.findAll(organizationId, paginationDto);
  }

  @Get('active')
  findActive(@CurrentOrganization() organizationId: string) {
    return this.plansService.findActive(organizationId);
  }

  @Get(':id')
  findOne(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.plansService.findOne(organizationId, id);
  }

  @Put(':id')
  update(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
  ) {
    return this.plansService.update(organizationId, id, updatePlanDto);
  }

  @Patch(':id/toggle')
  toggleActive(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.plansService.toggleActive(organizationId, id);
  }

  @Delete(':id')
  delete(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.plansService.delete(organizationId, id);
  }
}
