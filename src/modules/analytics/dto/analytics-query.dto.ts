import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum TimePeriod {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom',
}

export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Time period',
    // example: TimePeriod.CUSTOM,
  })
  @IsOptional()
  @IsEnum(TimePeriod)
  period?: TimePeriod = TimePeriod.CUSTOM;

  @ApiProperty({
    description: 'Start date',
    example: '2026-01-03',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date',
    example: '2026-01-17',
  })
  @IsDateString()
  endDate: string;
}
