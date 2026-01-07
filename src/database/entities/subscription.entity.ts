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
import { Customer } from './customer.entity';
import { Plan } from './plan.entity';
import { Invoice } from './invoice.entity';
import { ApiProperty } from '@nestjs/swagger';
// import { IsOptional } from 'class-validator';

@Entity('subscriptions')
export class Subscription {
  @ApiProperty({
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ type: 'uuid' })
  organization_id: string;

  @ApiProperty({
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ type: 'uuid' })
  customer_id: string;

  @ApiProperty({
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ type: 'uuid' })
  plan_id: string;

  @ApiProperty({
    description: 'Subscription status',
    example: 'active',
  })
  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string;

  @ApiProperty({
    description: 'Current period start',
    type: 'string',
    example: '2022-01-01T00:00:00.000Z',
  })
  @Column({ type: 'timestamp with time zone' })
  current_period_start: Date;

  @ApiProperty({
    description: 'Current period end',
    type: 'string',
    example: '2022-01-01T00:00:00.000Z',
  })
  @Column({ type: 'timestamp with time zone' })
  current_period_end: Date;

  @ApiProperty({
    description: 'Trial end',
    type: 'string',
    example: '2022-01-01T00:00:00.000Z',
  })
  @Column({
    name: 'trial_end',
    type: 'timestamp with time zone',
    nullable: true,
  })
  trial_end: Date | null;

  @ApiProperty({
    description: 'Cancelled at',
    type: 'string',
    example: '2022-01-01T00:00:00.000Z',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  canceled_at: Date;

  @ApiProperty({
    description: 'Ended at',
    type: 'string',
    example: '2022-01-01T00:00:00.000Z',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  ended_at: Date;

  @ApiProperty({
    type: 'string',
    example: {},
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ApiProperty({
    type: 'string',
    example: '2022-01-01T00:00:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @ApiProperty({
    type: 'string',
    example: '2022-01-01T00:00:00.000Z',
  })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @ManyToOne(() => Organization, (org) => org.subscriptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => Customer, (customer) => customer.subscriptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Plan, (plan) => plan.subscriptions)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @OneToMany(() => Invoice, (invoice) => invoice.subscription)
  invoices: Invoice[];
}
