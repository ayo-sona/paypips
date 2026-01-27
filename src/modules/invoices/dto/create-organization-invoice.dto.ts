import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { InvoiceStatus } from 'src/common/enums/enums';

export class CreateOrganizationInvoiceDto {
  @ApiProperty({ description: 'Subscription ID (optional)' })
  @IsUUID()
  @IsOptional()
  subscriptionId?: string;

  @ApiProperty({ description: 'Invoice amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Currency code', default: 'NGN' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Invoice status',
    enum: InvoiceStatus,
    default: InvoiceStatus.PENDING,
  })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @ApiProperty({ description: 'Due date' })
  @IsDateString()
  @IsOptional()
  dueDate?: Date;

  @ApiProperty({ description: 'Invoice description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
