import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @ApiProperty({
    description: 'Customer email',
    example: 'byers@gmail.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  //   @ApiProperty({
  //     description: 'Customer first name',
  //     example: 'Joyce',
  //   })
  //   @IsString()
  //   firstName: string;

  //   @ApiProperty({
  //     description: 'Customer last name',
  //     example: 'Byers',
  //   })
  //   @IsString()
  //   lastName: string;

  @ApiProperty({
    description: 'Customer phone number',
    example: '+254712345678',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
