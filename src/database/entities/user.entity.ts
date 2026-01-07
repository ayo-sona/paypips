import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
  @ApiProperty({
    description: 'User ID',
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
    description: 'User email',
    example: 'user@example.com',
  })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  password_hash: string;

  @ApiProperty({
    description: 'User first name',
    example: 'Zeke',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  first_name: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Jaegar',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  last_name: string;

  @ApiProperty({
    description: 'Role',
    example: 'staff',
  })
  @Column({ type: 'varchar', length: 50, default: 'staff' })
  role: string;

  @ApiProperty({
    description: 'Is active',
    example: true,
  })
  @Column({ type: 'boolean', default: true })
  is_active: boolean;

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

  @ManyToOne(() => Organization, (org) => org.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
