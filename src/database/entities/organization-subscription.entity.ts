import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Plan } from './plan.entity';

@Entity('organization_subscriptions')
export class OrganizationSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  organization_id: string;

  @Column({ type: 'uuid', nullable: true })
  plan_id: string;

  @Column({ type: 'text', default: 'active' })
  status: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  current_period_start: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  current_period_end: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  trial_end: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  canceled_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  ended_at: Date;

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

  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;
}
