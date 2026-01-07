// src/database/entities/organization.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Customer } from './customer.entity';
import { Plan } from './plan.entity';
import { Subscription } from './subscription.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('organizations')
export class Organization {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Organization ID',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Organization Name',
    example: 'Life Fitness',
  })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    description: 'john@example.com',
    example: 'john@example.com',
  })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @ApiProperty({
    description: 'Subscription Plans',
    example: 'Basic Plan',
  })
  @Column({ type: 'varchar', length: 50, default: 'free' })
  subscription_plan: string;

  @ApiProperty({
    description: 'Subscription Status',
    example: 'active',
  })
  @Column({ type: 'varchar', length: 50, default: 'active' })
  subscription_status: string;

  @ApiProperty({
    description: 'Trial Ends At',
    example: '2025-01-01T00:00:00.000Z',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  trial_ends_at: Date;

  @ApiProperty({
    description: 'Created At',
    example: '2025-01-01T00:00:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @ApiProperty({
    description: 'Updated At',
    example: '2025-01-01T00:00:00.000Z',
  })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @ApiProperty({
    description: 'User object',
  })
  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @ApiProperty({
    description: 'Customer object',
  })
  @OneToMany(() => Customer, (customer) => customer.organization)
  customers: Customer[];

  @ApiProperty({
    description: 'Plan object',
  })
  @OneToMany(() => Plan, (plan) => plan.organization)
  plans: Plan[];

  @ApiProperty({
    description: 'Subscription object',
  })
  @OneToMany(() => Subscription, (subscription) => subscription.organization)
  subscriptions: Subscription[];
}
