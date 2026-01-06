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
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string = 'NGN';

  @IsEnum(BillingInterval)
  interval: BillingInterval;

  @IsOptional()
  @IsNumber()
  @Min(1)
  intervalCount?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(0)
  trialPeriodDays?: number = 0;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
