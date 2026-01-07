import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsObject } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Customer ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  customerId: string;

  @ApiProperty({
    description: 'Plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  planId: string;

  @ApiProperty({
    description: 'Metadata',
    example: {},
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
