import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanDto } from './create-plan.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePlanDto extends PartialType(CreatePlanDto) {
  @ApiProperty({
    description: 'Plan activation status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
