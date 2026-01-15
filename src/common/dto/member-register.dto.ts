import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsInt,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class MemberRegisterDto {
  @ApiProperty({
    example: 'life-fitness',
  })
  @IsString()
  organizationSlug: string;

  @ApiProperty({
    example: 'kenny@life.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Kenny',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    example: 'John',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    example: '+2348123456789',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'Password123!',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: '123 Main St',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  medicalNotes?: string;

  @ApiProperty({
    example: '2000-01-01',
  })
  @Type(() => Date)
  @IsDate()
  dateOfBirth: Date;

  @ApiProperty({
    example: 0,
  })
  @IsOptional()
  @IsInt()
  checkInCount?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  metadata?: string;
}
