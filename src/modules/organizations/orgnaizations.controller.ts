import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteUserDto } from './dto/invite-user.dto';
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

  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Organization retrieved successfully',
    type: Organization,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiOperation({ summary: 'Get my organization' })
  @Get('me')
  async getMyOrganization(@CurrentOrganization() organizationId: string) {
    return this.organizationsService.getOrganization(organizationId);
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
    @CurrentUser() user: any,
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
    return this.organizationsService.getTeamMembers(organizationId);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'User invited successfully',
    content: {
      'application/json': {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'admin',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'User already invited' })
  @ApiOperation({ summary: 'Invite user to organization' })
  @Post('team/invite')
  async inviteUser(
    @CurrentOrganization() organizationId: string,
    @CurrentUser() user: any,
    @Body() inviteDto: InviteUserDto,
  ) {
    return this.organizationsService.inviteUser(
      organizationId,
      inviteDto,
      user.id,
    );
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
  @Delete('team/:userId')
  async removeUser(
    @CurrentOrganization() organizationId: string,
    @CurrentUser() user: any,
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
          totalCustomers: 100,
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
