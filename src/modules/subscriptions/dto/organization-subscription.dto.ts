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

// export class RenewOrgSubscriptionDto {
//   @ApiProperty({ description: 'Number of billing cycles to renew', default: 1 })
//   @IsOptional()
//   cycles: number = 1;

//   @ApiProperty({ required: false })
//   @IsString()
//   @IsOptional()
//   notes?: string;
// }
