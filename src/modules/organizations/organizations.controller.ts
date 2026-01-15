import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../../common/decorators/organization.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Organization } from '../../database/entities/organization.entity';
import { User } from '../../database/entities/user.entity';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @ApiResponse({
    status: 200,
    description: 'Organization retrieved successfully',
    type: Organization,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiOperation({ summary: 'Get organization by slug' })
  @Get('/:slug')
  async getOrganizationBySlug(@Param('slug') slug: string) {
    return this.organizationsService.getOrganization(slug);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Organization retrieved successfully',
    type: Organization,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiOperation({ summary: 'Select organization' })
  @Get('/:id')
  async selectOrganization(
    @Param('id') organizationId: string,
    @CurrentUser() user: User,
  ) {
    return this.organizationsService.selectOrganization(
      organizationId,
      user.id,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Organization updated successfully',
    type: Organization,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @ApiOperation({ summary: 'Update my organization' })
  @Put('me')
  async updateMyOrganization(
    @CurrentOrganization() organizationId: string,
    @CurrentUser() user: User,
    @Body() updateDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.updateOrganization(
      organizationId,
      updateDto,
      user.id,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Team members retrieved successfully',
    type: User,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiOperation({ summary: 'Get team members' })
  @Get('team')
  async getTeamMembers(@CurrentOrganization() organizationId: string) {
    return this.organizationsService.getStaffMembers(organizationId);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'User removed successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiOperation({ summary: 'Remove user from organization' })
  @Delete('/:userId')
  async removeUser(
    @CurrentOrganization() organizationId: string,
    @CurrentUser() user: User,
    @Param('userId') userId: string,
  ) {
    return this.organizationsService.removeUser(
      organizationId,
      userId,
      user.id,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Organization stats retrieved successfully',
    content: {
      'application/json': {
        example: {
          totalUsers: 10,
          totalMembers: 100,
          totalPlans: 4,
          activeSubscriptions: 90,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiOperation({ summary: 'Get organization stats' })
  @Get('stats')
  async getStats(@CurrentOrganization() organizationId: string) {
    return this.organizationsService.getOrganizationStats(organizationId);
  }
}
