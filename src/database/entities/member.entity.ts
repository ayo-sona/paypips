import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
  OneToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { OrganizationUser } from './organization-user.entity';
import { MemberSubscription } from './member-subscription.entity';
import { User } from './user.entity';

@Entity('members')
@Unique(['organization_user_id'])
export class Member {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier for the member',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ type: 'uuid', unique: true })
  organization_user_id: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ type: 'uuid' })
  user_id: string;

  @ApiProperty({
    description: 'Member date of birth',
    example: '2023-01-01',
  })
  @Column({ type: 'date' })
  date_of_birth: Date;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  emergency_contact_name: string;

  @Column({ type: 'text', nullable: true })
  emergency_contact_phone: string;

  @Column({ type: 'text', nullable: true })
  medical_notes: string;

  @Column({ type: 'int', default: 0 })
  check_in_count: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'Member created at',
    example: '2023-01-01T00:00:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @ApiProperty({
    description: 'Member updated at',
    example: '2023-01-01T00:00:00.000Z',
  })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @OneToOne(() => OrganizationUser, (orgUser) => orgUser.member, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_user_id' })
  organization_user: OrganizationUser;

  @ManyToOne(() => User, (user) => user.members)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => MemberSubscription, (sub) => sub.member)
  subscriptions: MemberSubscription[];
}
