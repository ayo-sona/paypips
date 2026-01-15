import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsPhoneNumber,
  IsObject,
} from 'class-validator';

export class UpdateMemberDto {
  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiProperty({
    description: 'Address',
    example: '123 Main St, City, Country',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Emergency contact name',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  emergency_contact_name?: string;

  @ApiProperty({
    description: 'Emergency contact phone',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  emergency_contact_phone?: string;

  @ApiProperty({
    description: 'Medical notes',
    example: 'Allergic to penicillin',
    required: false,
  })
  @IsOptional()
  @IsString()
  medical_notes?: string;

  @ApiProperty({
    description: 'Additional metadata',
    example: { key: 'value' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
