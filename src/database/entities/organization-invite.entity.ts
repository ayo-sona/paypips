import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { ManyToOne, JoinColumn } from 'typeorm';
import { OrgRole } from 'src/common/enums/enums';

@Entity('organization_invites')
export class OrganizationInvite {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Invite ID',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Organization ID',
  })
  @Column({ type: 'uuid' })
  organization_id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Invited By',
  })
  @Column({ type: 'uuid' })
  invited_by_id: string;

  @ApiProperty({
    description: 'john@example.com',
    example: 'john@example.com',
  })
  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'text', default: OrgRole.ADMIN })
  @ApiProperty({
    description: 'Role',
    example: 'admin',
  })
  @IsEnum(OrgRole)
  role: string;

  @Column({ type: 'text' })
  token: string;

  @Column({ type: 'text', default: 'false' })
  accepted: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  accepted_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at: Date;

  @ApiProperty({
    description: 'Created At',
    example: '2025-01-01T00:00:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @ManyToOne(() => Organization, (org) => org.invitations)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => User, (user) => user.invitations)
  @JoinColumn({ name: 'invited_by_id' })
  invited_by: User;
}
