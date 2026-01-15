import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { StaffRegisterDto } from 'src/common/dto/staff-register.dto';
import { InviteStaffDto } from './dto/invite-staff.dto';

@ApiTags('Invitations')
@Controller('invitations')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: InviteStaffDto })
  @ApiOperation({
    summary: 'Invite a new staff member',
    description: 'Invite a new staff member to an organization',
  })
  @ApiResponse({ status: 201, description: 'Invitation created successfully' })
  async inviteStaff(@CurrentUser() user: User, @Body() body: InviteStaffDto) {
    const organization =
      await this.invitationsService.getCurrentOrganization(user);

    if (!organization) {
      throw new Error('User is not associated with any organization');
    }

    return this.invitationsService.createInvitation(
      organization,
      user,
      body.staffEmail,
    );
  }

  @Get('validate/:token')
  @ApiOperation({
    summary: 'Validate an invitation token',
    description: 'Validate an invitation token',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation validated successfully',
  })
  async validateInvitation(@Param('token') token: string) {
    const invitation = await this.invitationsService.validateInvitation(token);
    return {
      valid: true,
      email: invitation.email,
      organization: invitation.organization.name,
    };
  }

  @Post('accept/:token')
  @ApiOperation({
    summary: 'Accept an invitation',
    description: 'Accept an invitation',
  })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  async acceptInvitation(
    @Param('token') token: string,
    @Body() body: StaffRegisterDto,
  ) {
    return this.invitationsService.acceptInvitation(token, body);
  }
}
