import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsObject } from 'class-validator';

enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
}

export class UpdateSubscriptionDto {
  @ApiProperty({
    description: 'Subscription status',
    example: 'active',
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiProperty({
    description: 'Metadata',
    example: {},
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
