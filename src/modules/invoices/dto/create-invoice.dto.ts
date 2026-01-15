import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsString,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceDto {
  @IsUUID()
  billedUserId: string;

  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string = 'NGN';

  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @IsOptional()
  metadata?: Record<string, any>;
}
