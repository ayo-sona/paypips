import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FindAllMemberSubscriptionsDto {
  @ApiProperty({
    description: 'Page number',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @ApiProperty({
    description: 'Limit number',
    example: 10,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Status',
    example: 'active',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
