import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutSessionDto {
  @ApiProperty({
    description: 'The price ID to subscribe to',
    example: 'price_123456789',
  })
  @IsString()
  priceId: string;

  @ApiProperty({
    description: 'The URL to redirect to on successful payment',
    example: 'https://example.com/success',
  })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiProperty({
    description: 'The URL to redirect to on canceled payment',
    example: 'https://example.com/cancel',
  })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'The price ID to subscribe to',
    example: 'price_123456789',
  })
  @IsString()
  priceId: string;
}

export class CancelSubscriptionDto {
  @ApiProperty({
    description: 'Whether to cancel immediately or at the end of the period',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  immediate?: boolean;
}

export class UpdateSubscriptionDto {
  @ApiProperty({
    description: 'The new price ID to upgrade to',
    example: 'price_123456789',
  })
  @IsString()
  newPriceId: string;
}
