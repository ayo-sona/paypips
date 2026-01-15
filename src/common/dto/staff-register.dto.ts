import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { MemberRegisterDto } from './member-register.dto';

export class StaffRegisterDto extends PartialType(MemberRegisterDto) {
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
}
