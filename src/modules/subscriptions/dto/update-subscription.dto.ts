import { IsEnum, IsOptional, IsObject } from 'class-validator';

enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
