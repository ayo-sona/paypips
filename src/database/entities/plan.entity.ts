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
import { Subscription } from './subscription.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('plans')
export class Plan {
  @ApiProperty({
    description: 'Plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ type: 'uuid' })
  organization_id: string;

  @ApiProperty({
    description: 'Plan name',
    example: 'Basic Plan',
  })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    description: 'Plan description',
    example: 'Gym Perks',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Plan amount',
    example: 1000,
  })
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @ApiProperty({
    description: 'Plan currency',
    example: 'NGN',
  })
  @Column({ type: 'varchar', length: 3, default: 'NGN' })
  currency: string;

  @ApiProperty({
    description: 'Plan interval',
    example: 'month',
  })
  @Column({ type: 'varchar', length: 20 })
  interval: string;

  @ApiProperty({
    description: 'Plan interval count',
    example: 1,
  })
  @Column({ type: 'int', default: 1 })
  interval_count: number;

  @ApiProperty({
    description: 'Plan trial period days',
    example: 14,
  })
  @Column({ type: 'int', default: 0 })
  trial_period_days: number;

  @ApiProperty({
    description: 'Plan features',
    example: ['Chilling in the lounge', 'Beverages'],
  })
  @Column({ type: 'jsonb', nullable: true })
  features: string[];

  @ApiProperty({
    description: 'Plan is active',
    example: true,
  })
  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ApiProperty({
    description: 'Plan created at',
    example: '2022-01-01T00:00:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @ApiProperty({
    description: 'Plan updated at',
    example: '2022-01-01T00:00:00.000Z',
  })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @ManyToOne(() => Organization, (org) => org.plans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @OneToMany(() => Subscription, (sub) => sub.plan)
  subscriptions: Subscription[];
}
