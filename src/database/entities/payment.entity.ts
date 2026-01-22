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
import { Invoice } from './invoice.entity';
import { User } from './user.entity';
import { IsEnum } from 'class-validator';

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
}

export enum StripePaymentIntentStatus {
  SUCCEEDED = 'succeeded',
  CANCELLED = 'cancelled',
  PROCESSING = 'processing',
  REQUIRES_ACTION = 'requires_action',
  REQUIRES_CAPTURE = 'requires_capture',
  REQUIRES_CONFIRMATION = 'requires_confirmation',
  REQUIRES_PAYMENT_METHOD = 'requires_payment_method',
}

export enum PaymentProvider {
  PAYSTACK = 'paystack',
  STRIPE = 'stripe',
}

export enum PaymentPayerType {
  ORGANIZATION = 'organization',
  USER = 'user',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  payer_org_id: string;

  @Column({ type: 'uuid' })
  payer_user_id: string;

  @Column({ type: 'uuid', nullable: true })
  invoice_id: string;

  @Column({ type: 'text' })
  @IsEnum(PaymentPayerType)
  payer_type: PaymentPayerType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'text', default: 'NGN' })
  currency: string;

  @Column({ type: 'text' })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @Column({ type: 'text', unique: true, nullable: true })
  provider_reference: string;

  @Column({ type: 'text', default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payer_org_id' })
  payer_org: Organization;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payer_user_id' })
  payer_user: User;

  @ManyToOne(() => Invoice, (invoice) => invoice.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;
}
