import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Organization } from './organization.entity';
import { OrganizationPlan } from './organization-plan.entity';
import { Invoice } from './invoice.entity';
import { SubscriptionStatus } from 'src/common/enums/enums';

@Entity('organization_subscriptions')
export class OrganizationSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  organization_id: string;

  @Column({ type: 'uuid' })
  plan_id: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp with time zone' })
  started_at: Date;

  @Column({ type: 'timestamp with time zone' })
  expires_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  canceled_at: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @OneToOne(() => Organization, (org) => org.subscription, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => OrganizationPlan)
  @JoinColumn({ name: 'plan_id' })
  plan: OrganizationPlan;

  @OneToMany(() => Invoice, (invoice) => invoice.organization_subscription)
  invoices: Invoice[];
}
