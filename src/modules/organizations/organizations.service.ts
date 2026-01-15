import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../database/entities/organization.entity';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import {
  OrganizationUser,
  OrgRole,
} from '../../database/entities/organization-user.entity';
import { AuthService } from '../auth/auth.service';
import { MemberPlan } from 'src/database/entities';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,

    @InjectRepository(OrganizationUser)
    private organizationUserRepository: Repository<OrganizationUser>,

    @InjectRepository(MemberPlan)
    private memberPlanRepository: Repository<MemberPlan>,

    private authService: AuthService,
  ) {}

  async getOrganization(slug: string) {
    const organization = await this.organizationRepository.findOne({
      where: { slug },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return {
      message: 'Organization retrieved successfully',
      data: organization,
    };
  }

  async selectOrganization(
    userId: string,
    organizationId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const orgUser = await this.organizationUserRepository.findOne({
      where: { user_id: userId, organization_id: organizationId },
      relations: ['organization', 'user'],
    });

    if (!orgUser) {
      throw new UnauthorizedException('Access denied');
    }

    // Generate new tokens for this organization
    return this.authService.generateTokens(orgUser.user, ipAddress, userAgent);
  }

  async updateOrganization(
    organizationId: string,
    updateDto: UpdateOrganizationDto,
    userId: string,
  ) {
    // Check if user is admin
    const orgUser = await this.organizationUserRepository.findOne({
      where: { user_id: userId, organization_id: organizationId },
      relations: ['organization'],
    });

    if (!orgUser || orgUser.role !== OrgRole.ADMIN) {
      throw new ForbiddenException('Only admins can update organization');
    }

    // Check if email is being changed and is unique
    if (updateDto.email && updateDto.email !== orgUser.organization.email) {
      const existingOrg = await this.organizationRepository.findOne({
        where: { email: updateDto.email },
      });

      if (existingOrg) {
        throw new ConflictException('Email already in use');
      }
    }

    Object.assign(orgUser.organization, updateDto);
    const updated = await this.organizationRepository.save(
      orgUser.organization,
    );

    return {
      message: 'Organization updated successfully',
      data: updated,
    };
  }

  async getStaffMembers(organizationId: string) {
    const users = await this.organizationUserRepository.find({
      where: { organization_id: organizationId },
      select: ['id', 'user_id', 'role', 'status'],
    });

    return {
      message: 'Team members retrieved successfully',
      data: users,
    };
  }

  async removeUser(
    organizationId: string,
    userIdToRemove: string,
    removerId: string,
  ) {
    // Check if remover is admin
    const remover = await this.organizationUserRepository.findOne({
      where: { user_id: removerId, organization_id: organizationId },
    });

    if (!remover || remover.role !== OrgRole.ADMIN) {
      throw new ForbiddenException('Only admins can remove users');
    }

    // Prevent removing self
    if (userIdToRemove === removerId) {
      throw new ForbiddenException('Cannot remove yourself');
    }

    // Find user to remove
    const userToRemove = await this.organizationUserRepository.findOne({
      where: { user_id: userIdToRemove, organization_id: organizationId },
    });

    if (!userToRemove) {
      throw new NotFoundException('User not found');
    }

    // Soft delete by marking inactive
    userToRemove.status = 'inactive';
    await this.organizationUserRepository.save(userToRemove);

    return {
      message: 'User removed successfully',
    };
  }

  async getOrganizationStats(organizationId: string) {
    // Get basic stats
    const [totalUsers, totalMembers, totalPlans, activeSubscriptions] =
      await Promise.all([
        this.organizationUserRepository.count({
          where: { organization_id: organizationId, status: 'active' },
        }),
        this.organizationUserRepository.query(
          'SELECT COUNT(*) as count FROM organization_users WHERE role = $1',
          [OrgRole.MEMBER],
        ),
        this.memberPlanRepository.query(
          'SELECT COUNT(*) as count FROM member_plans WHERE organization_id = $1 AND is_active = true',
          [organizationId],
        ),
        this.memberPlanRepository.query(
          `SELECT COUNT(DISTINCT ms.id) as count 
            FROM member_subscriptions ms
            INNER JOIN member_plans mp ON ms.plan_id = mp.id
            WHERE mp.organization_id = $1 
            AND ms.status = 'active'`,
          [organizationId],
        ),
      ]);

    return {
      message: 'Organization stats retrieved successfully',
      data: {
        totalUsers,
        totalMembers: parseInt(totalMembers[0].count),
        totalPlans: parseInt(totalPlans[0].count),
        activeSubscriptions: parseInt(activeSubscriptions[0].count),
      },
    };
  }
}
