import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Subscription } from './subscription.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('customers')
@Unique(['organization_id', 'email'])
export class Customer {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier for the customer',
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
    description: 'Customer email',
    example: 'customer@example.com',
  })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @ApiProperty({
    description: 'Customer first name',
    example: 'Steve',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  first_name: string;

  @ApiProperty({
    description: 'Customer last name',
    example: 'Jobs',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  last_name: string;

  @ApiProperty({
    description: 'Customer phone number',
    example: '+2348123456789',
  })
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @ApiProperty({
    description: 'Customer metadata',
    example: {},
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'Customer created at',
    example: '2023-01-01T00:00:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @ApiProperty({
    description: 'Customer updated at',
    example: '2023-01-01T00:00:00.000Z',
  })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @ManyToOne(() => Organization, (org) => org.customers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @OneToMany(() => Subscription, (sub) => sub.customer)
  subscriptions: Subscription[];
}
