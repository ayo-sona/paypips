import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { OrganizationUser } from './organization-user.entity';
import { RefreshToken } from './refresh-token.entity';
import { OrganizationInvite } from './organization-invite.entity';
import { Member } from './member.entity';

@Entity('users')
export class User {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'text' })
  @Exclude()
  password_hash: string;

  @ApiProperty({
    description: 'User first name',
    example: 'Zeke',
  })
  @Column({ type: 'text' })
  first_name: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Jaegar',
  })
  @Column({ type: 'text' })
  last_name: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+2348123456789',
  })
  @Column({ type: 'text', nullable: true })
  phone: string;

  @Column({ type: 'text', default: 'active' })
  status: string;

  @Column({ type: 'boolean', default: false })
  email_verified: boolean;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  last_login_at: Date;

  @ApiProperty({
    description: 'Created at',
    example: '2023-01-01T00:00:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @ApiProperty({
    description: 'Updated at',
    example: '2023-01-01T00:00:00.000Z',
  })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @OneToMany(() => OrganizationUser, (orgUser) => orgUser.user)
  organization_users: OrganizationUser[];

  @OneToMany(() => Member, (member) => member.user)
  members: Member[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refresh_tokens: RefreshToken[];

  @OneToMany(() => OrganizationInvite, (invite) => invite.invited_by)
  invitations: OrganizationInvite[];
}
