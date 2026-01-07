import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Customer email',
    example: 'byers@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Customer first name',
    example: 'Joyce',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Customer last name',
    example: 'Byers',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Customer phone number',
    example: '+254712345678',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Customer metadata',
    example: '{ "key": "value" }',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
