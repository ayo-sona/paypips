import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Organization } from '../../database/entities/organization.entity';
import { User } from '../../database/entities/user.entity';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteUserDto } from './dto/invite-user.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getOrganization(organizationId: string) {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return {
      message: 'Organization retrieved successfully',
      data: organization,
    };
  }

  async updateOrganization(
    organizationId: string,
    updateDto: UpdateOrganizationDto,
    userId: string,
  ) {
    // Check if user is admin
    const user = await this.userRepository.findOne({
      where: { id: userId, organization_id: organizationId },
    });

    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Only admins can update organization');
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if email is being changed and is unique
    if (updateDto.email && updateDto.email !== organization.email) {
      const existingOrg = await this.organizationRepository.findOne({
        where: { email: updateDto.email },
      });

      if (existingOrg) {
        throw new ConflictException('Email already in use');
      }
    }

    Object.assign(organization, updateDto);
    const updated = await this.organizationRepository.save(organization);

    return {
      message: 'Organization updated successfully',
      data: updated,
    };
  }

  async getTeamMembers(organizationId: string) {
    const users = await this.userRepository.find({
      where: { organization_id: organizationId },
      select: [
        'id',
        'email',
        'first_name',
        'last_name',
        'role',
        'is_active',
        'created_at',
      ],
    });

    return {
      message: 'Team members retrieved successfully',
      data: users,
    };
  }

  async inviteUser(
    organizationId: string,
    inviteDto: InviteUserDto,
    inviterId: string,
  ) {
    // Check if inviter is admin
    const inviter = await this.userRepository.findOne({
      where: { id: inviterId, organization_id: organizationId },
    });

    if (!inviter || inviter.role !== 'admin') {
      throw new ForbiddenException('Only admins can invite users');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: inviteDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(inviteDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      organization_id: organizationId,
      email: inviteDto.email,
      password_hash: hashedPassword,
      first_name: inviteDto.firstName,
      last_name: inviteDto.lastName,
      role: inviteDto.role,
      is_active: true,
    });

    const savedUser = await this.userRepository.save(user);

    return {
      message: 'User invited successfully',
      data: {
        id: savedUser.id,
        email: savedUser.email,
        first_name: savedUser.first_name,
        last_name: savedUser.last_name,
        role: savedUser.role,
      },
    };
  }

  async removeUser(
    organizationId: string,
    userIdToRemove: string,
    removerId: string,
  ) {
    // Check if remover is admin
    const remover = await this.userRepository.findOne({
      where: { id: removerId, organization_id: organizationId },
    });

    if (!remover || remover.role !== 'admin') {
      throw new ForbiddenException('Only admins can remove users');
    }

    // Prevent removing self
    if (userIdToRemove === removerId) {
      throw new ForbiddenException('Cannot remove yourself');
    }

    // Find user to remove
    const userToRemove = await this.userRepository.findOne({
      where: { id: userIdToRemove, organization_id: organizationId },
    });

    if (!userToRemove) {
      throw new NotFoundException('User not found');
    }

    // Soft delete by marking inactive
    userToRemove.is_active = false;
    await this.userRepository.save(userToRemove);

    return {
      message: 'User removed successfully',
    };
  }

  async getOrganizationStats(organizationId: string) {
    // Get basic stats
    const [totalUsers, totalCustomers, totalPlans, activeSubscriptions] =
      await Promise.all([
        this.userRepository.count({
          where: { organization_id: organizationId, is_active: true },
        }),
        this.userRepository.query(
          'SELECT COUNT(*) as count FROM customers WHERE organization_id = $1',
          [organizationId],
        ),
        this.userRepository.query(
          'SELECT COUNT(*) as count FROM plans WHERE organization_id = $1 AND is_active = true',
          [organizationId],
        ),
        this.userRepository.query(
          "SELECT COUNT(*) as count FROM subscriptions WHERE organization_id = $1 AND status = 'active'",
          [organizationId],
        ),
      ]);

    return {
      message: 'Organization stats retrieved successfully',
      data: {
        totalUsers,
        totalCustomers: parseInt(totalCustomers[0].count),
        totalPlans: parseInt(totalPlans[0].count),
        activeSubscriptions: parseInt(activeSubscriptions[0].count),
      },
    };
  }
}
