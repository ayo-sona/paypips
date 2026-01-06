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

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me')
  async getMyOrganization(@CurrentOrganization() organizationId: string) {
    return this.organizationsService.getOrganization(organizationId);
  }

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

  @Get('team')
  async getTeamMembers(@CurrentOrganization() organizationId: string) {
    return this.organizationsService.getTeamMembers(organizationId);
  }

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

  @Get('stats')
  async getStats(@CurrentOrganization() organizationId: string) {
    return this.organizationsService.getOrganizationStats(organizationId);
  }
}
