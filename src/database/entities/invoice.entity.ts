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
import { User } from './user.entity';
import { Payment } from './payment.entity';
import { MemberSubscription } from './member-subscription.entity';

export enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
  FAILED = 'failed',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  member_subscription_id: string;

  @Column({ type: 'uuid' })
  issuer_org_id: string;

  @Column({ type: 'uuid' })
  billed_user_id: string;

  @Column({ type: 'text', unique: true })
  invoice_number: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'text', default: 'NGN' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  payment_provider: string;

  @Column({ type: 'text', nullable: true })
  provider_reference: string;

  @Column({ type: 'text', default: InvoiceStatus.PENDING })
  status: InvoiceStatus;

  @Column({ type: 'timestamp with time zone' })
  due_date: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  paid_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @Column({ type: 'text', nullable: true })
  issuer_type: string;

  @Column({ type: 'text', nullable: true })
  billed_type: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issuer_org_id' })
  issuer_org: Organization;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'billed_user_id' })
  billed_user: User;

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];

  @ManyToOne(
    () => MemberSubscription,
    (subscription) => subscription.invoices,
    {
      onDelete: 'SET NULL',
      nullable: true,
    },
  )
  @JoinColumn({ name: 'member_subscription_id' })
  member_subscription: MemberSubscription;
}
