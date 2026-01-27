import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Member } from './member.entity';
import { MemberPlan } from './member-plan.entity';
import { Organization } from './organization.entity';
import { Invoice } from './invoice.entity';
import { SubscriptionStatus } from 'src/common/enums/enums';

@Entity('member_subscriptions')
export class MemberSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  member_id: string;

  @Column({ type: 'uuid' })
  plan_id: string;

  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'text', default: SubscriptionStatus.ACTIVE })
  status: string;

  @Column({ type: 'timestamp with time zone' })
  started_at: Date;

  @Column({ type: 'timestamp with time zone' })
  expires_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  canceled_at: Date | null;

  @Column({ type: 'boolean', default: true })
  auto_renew: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @ManyToOne(() => Member, (member) => member.subscriptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @ManyToOne(() => MemberPlan, (plan) => plan.subscriptions)
  @JoinColumn({ name: 'plan_id' })
  plan: MemberPlan;

  @ManyToOne(() => Organization, (org) => org.memberSubscriptions)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @OneToMany(() => Invoice, (invoice) => invoice.member_subscription)
  invoices: Invoice[];
}
