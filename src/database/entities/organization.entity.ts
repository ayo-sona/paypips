import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { OrganizationUser } from './organization-user.entity';
import { OrganizationSubscription } from './organization-subscription.entity';
import { MemberPlan } from './member-plan.entity';
import { OrganizationInvite } from './organization-invite.entity';
import { MemberSubscription } from './member-subscription.entity';
import { OrganizationPlan } from './organization_plan.entity';

@Entity('organizations')
export class Organization {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Organization ID',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Organization Name',
    example: 'Life Fitness',
  })
  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', unique: true })
  slug: string;

  @ApiProperty({
    description: 'john@example.com',
    example: 'john@example.com',
  })
  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'text', default: 'active' })
  status: string;

  @ApiProperty({
    description: 'Trial Ends At',
    example: '2025-01-01T00:00:00.000Z',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  trial_ends_at: Date;

  @ApiProperty({
    description: 'Created At',
    example: '2025-01-01T00:00:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @ApiProperty({
    description: 'Updated At',
    example: '2025-01-01T00:00:00.000Z',
  })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @OneToMany(() => OrganizationUser, (orgUser) => orgUser.organization)
  organization_users: OrganizationUser[];

  @OneToOne(() => OrganizationSubscription, (sub) => sub.organization)
  subscription: OrganizationSubscription;

  @OneToMany(() => MemberPlan, (plan) => plan.organization)
  member_plans: MemberPlan[];

  @OneToMany(() => OrganizationPlan, (plan) => plan.organization)
  organization_plans: OrganizationPlan[];

  @OneToMany(() => MemberSubscription, (sub) => sub.organization)
  memberSubscriptions: MemberSubscription[];

  @OneToMany(() => OrganizationInvite, (invite) => invite.organization)
  invitations: OrganizationInvite[];
}
