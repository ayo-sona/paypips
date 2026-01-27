export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  PENDING = 'pending',
}

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

export enum OrgRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  MEMBER = 'MEMBER',
}

export enum PlanInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  QUARTERLY = 'quarterly',
}

export enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum InvoiceBilledType {
  ORGANIZATION = 'organization',
  USER = 'user',
}
