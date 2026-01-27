import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationInvite } from '../../database/entities/organization-invite.entity';
import { OrgRole } from 'src/common/enums/enums';
import { Organization } from '../../database/entities/organization.entity';
import { User } from '../../database/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { OrganizationUser } from 'src/database/entities/organization-user.entity';
import { AuthService } from '../auth/auth.service';
import { StaffRegisterDto } from 'src/common/dto/staff-register.dto';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(OrganizationInvite)
    private invitationRepository: Repository<OrganizationInvite>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private notificationsService: NotificationsService,
    private configService: ConfigService,
    private authService: AuthService,

    @InjectRepository(OrganizationUser)
    private organizationUserRepository: Repository<OrganizationUser>,
  ) {}

  async getCurrentOrganization(user: User): Promise<Organization> {
    if (!user) {
      throw new Error('User not found');
    }

    const orgUser = await this.organizationUserRepository.findOne({
      where: { user_id: user.id },
      relations: ['organization'],
    });

    if (!orgUser) {
      throw new Error('User is not associated with any organization');
    }

    return orgUser.organization;
  }

  async createInvitation(
    organization: Organization,
    invitedBy: User,
    staffEmail: string,
  ) {
    // Check for existing invitation
    const existing = await this.invitationRepository.findOne({
      where: {
        organization_id: organization.id,
        email: staffEmail,
        accepted: 'false',
      },
    });

    if (existing) {
      return existing;
    }

    // Create new invitation
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitation = this.invitationRepository.create({
      organization_id: organization.id,
      invited_by_id: invitedBy.id,
      email: staffEmail,
      token,
      expires_at: expiresAt,
      role: OrgRole.STAFF,
    });

    const savedInvitation = await this.invitationRepository.save(invitation);

    // Send invitation email
    await this.sendInvitationEmail(savedInvitation, organization);

    return savedInvitation;
  }

  async validateInvitation(token: string): Promise<OrganizationInvite> {
    const invitation = await this.invitationRepository.findOne({
      where: { token, accepted: 'false' },
      relations: ['organization'],
    });
    console.log('invitation', invitation);

    if (!invitation || new Date() > invitation.expires_at) {
      throw new Error('Invalid or expired invitation');
    }

    return invitation;
  }

  async acceptInvitation(token: string, body: StaffRegisterDto) {
    const invitation = await this.validateInvitation(token);

    // Mark invitation as accepted
    invitation.accepted = 'true';
    invitation.accepted_at = new Date();
    await this.invitationRepository.save(invitation);

    // Add user to organization with specified role
    await this.authService.registerStaff(body, invitation.token);

    return { success: true };
  }

  private async sendInvitationEmail(
    invitation: OrganizationInvite,
    organization: Organization,
  ) {
    const frontendUrl = this.configService.get('frontend.url');
    const acceptUrl = `${frontendUrl}/accept-invitation?token=${invitation.token}`;

    // await this.notificationsService.sendEmail({
    //   to: invitation.email,
    //   subject: `You've been invited to join ${organization.name}`,
    //   template: 'staff-invitation',
    //   context: {
    //     organizationName: organization.name,
    //     inviterName: invitation.invited_by || 'An admin',
    //     acceptUrl,
    //     expiresIn: '7 days',
    //   },
    // });
  }
}
