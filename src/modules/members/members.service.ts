import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Member } from '../../database/entities/member.entity';
import { OrganizationUser } from '../../database/entities/organization-user.entity';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(OrganizationUser)
    private orgUserRepository: Repository<OrganizationUser>,
  ) {}

  async findAll(organizationId: string, search?: string): Promise<Member[]> {
    // First get all org user IDs for this organization
    const orgUsers = await this.orgUserRepository.find({
      where: { organization_id: organizationId },
      select: ['id'],
    });

    const orgUserIds = orgUsers.map((ou) => ou.id);

    if (orgUserIds.length === 0) {
      return [];
    }

    const query = this.memberRepository
      .createQueryBuilder('member')
      .where('member.organization_user_id IN (:...orgUserIds)', { orgUserIds })
      .leftJoinAndSelect('member.organization_user', 'organization_user')
      .leftJoinAndSelect('organization_user.user', 'user');

    if (search) {
      query.andWhere(
        '(member.emergency_contact_name ILIKE :search OR user.email ILIKE :search OR user.first_name ILIKE :search OR user.last_name ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    return query.getMany();
  }

  async findOne(organizationId: string, userId: string): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_user: {
          organization_id: organizationId,
        },
      },
      relations: ['organization_user', 'organization_user.user'],
    });

    if (!member) {
      throw new NotFoundException(`Member not found in this organization`);
    }
    return member;
  }

  async update(
    organizationId: string,
    userId: string,
    updateDto: UpdateMemberDto,
  ): Promise<Member> {
    const member = await this.findOne(organizationId, userId);

    // Only update allowed fields
    const updated = this.memberRepository.merge(member, {
      date_of_birth: updateDto.date_of_birth,
      address: updateDto.address,
      emergency_contact_name: updateDto.emergency_contact_name,
      emergency_contact_phone: updateDto.emergency_contact_phone,
      medical_notes: updateDto.medical_notes,
      metadata: updateDto.metadata,
    });

    return this.memberRepository.save(updated);
  }

  async delete(organizationId: string, userId: string) {
    const member = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_user: {
          organization_id: organizationId,
        },
      },
      relations: ['subscriptions'],
    });

    if (!member) {
      throw new NotFoundException('Member not found in this organization');
    }

    // Check for active subscriptions
    const hasActiveSubscriptions = member.subscriptions?.some(
      (sub) => sub.status === 'active',
    );

    if (hasActiveSubscriptions) {
      throw new ConflictException(
        'Cannot delete member with active subscriptions',
      );
    }

    await this.memberRepository.remove(member);

    return {
      message: 'Member deleted successfully',
    };
  }

  async getMemberStats(organizationId: string, userId: string) {
    const member = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_user: {
          organization_id: organizationId,
        },
      },
      relations: ['organization_user'],
    });

    if (!member) {
      throw new NotFoundException('Member not found in this organization');
    }

    // Get subscription stats
    const [subscriptions, invoices, totalPaid] = await Promise.all([
      this.memberRepository.query(
        `SELECT COUNT(*) as count, status
         FROM member_subscriptions
         WHERE member_id = $1
         GROUP BY status`,
        [member.id],
      ),
      this.memberRepository.query(
        `SELECT COUNT(*) as count, status
         FROM invoices
         WHERE billed_user_id = $1
         GROUP BY status`,
        [member.user_id],
      ),
      this.memberRepository.query(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM payments
         WHERE payer_user_id = $1 AND status = 'success'`,
        [member.user_id],
      ),
    ]);

    return {
      message: 'Member stats retrieved successfully',
      data: {
        subscriptions: subscriptions.reduce((acc, curr) => {
          acc[curr.status] = parseInt(curr.count);
          return acc;
        }, {}),
        invoices: invoices.reduce((acc, curr) => {
          acc[curr.status] = parseInt(curr.count);
          return acc;
        }, {}),
        totalPaid: parseFloat(totalPaid[0].total),
      },
    };
  }
}
