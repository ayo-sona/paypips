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
import { Organization } from './organization.entity';
import { MemberSubscription } from './member-subscription.entity';
import { ApiProperty } from '@nestjs/swagger';
import { PlanInterval } from 'src/common/enums/enums';

@Entity('member_plans')
export class MemberPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Plan price',
    example: 10000,
  })
  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'text', default: 'NGN' })
  currency: string;

  @ApiProperty({
    description: 'Plan interval',
    example: PlanInterval.MONTHLY,
  })
  @Column({ type: 'text' })
  interval: PlanInterval;

  @ApiProperty({
    description: 'Plan interval count',
    example: 1,
  })
  @Column({ type: 'int', default: 1 })
  interval_count: number;

  @Column({ type: 'jsonb', nullable: true })
  features: string[];

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @ManyToOne(() => Organization, (org) => org.member_plans, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @OneToMany(() => MemberSubscription, (sub) => sub.plan)
  subscriptions: MemberSubscription[];
}
