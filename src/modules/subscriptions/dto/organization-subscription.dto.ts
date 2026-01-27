import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus } from 'src/common/enums/enums';

export class UpdateOrgSubscriptionStatusDto {
  @ApiProperty({ enum: SubscriptionStatus })
  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class ChangeOrgSubscriptionPlanDto {
  @ApiProperty()
  @IsUUID()
  newPlanId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateOrgSubscriptionDto {
  @ApiProperty({
    description: 'Enterprise Plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  planId: string;
}
