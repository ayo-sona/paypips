import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { Member } from './member.entity';

export enum OrgRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  MEMBER = 'MEMBER',
}

@Entity('organization_users')
@Unique(['user_id', 'organization_id'])
export class OrganizationUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({
    type: 'enum',
    enum: OrgRole,
    default: OrgRole.MEMBER,
  })
  role: OrgRole;

  @Column({ type: 'text', default: 'active' })
  status: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.organization_users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Organization, (org) => org.organization_users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @OneToOne(() => Member, (member) => member.organization_user)
  member: Member;
}
