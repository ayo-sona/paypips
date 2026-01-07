import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  Min,
} from 'class-validator';

enum BillingInterval {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class CreatePlanDto {
  @ApiProperty({
    description: 'Plan name',
    example: 'Basic Plan',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Plan description',
    example: 'Basic Plan Description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Plan amount',
    example: '15000',
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Currency',
    example: 'NGN',
  })
  @IsOptional()
  @IsString()
  currency?: string = 'NGN';

  @ApiProperty({
    description: 'Interval',
    example: 'monthly',
  })
  @IsEnum(BillingInterval)
  interval: BillingInterval;

  @ApiProperty({
    description: 'Interval count',
    example: '1',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  intervalCount?: number = 1;

  @ApiProperty({
    description: 'Trial period days',
    example: '14',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  trialPeriodDays?: number = 0;

  @ApiProperty({
    description: 'Plan features',
    example: 'Basic Plan Features',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
