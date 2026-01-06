import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Organization name',
    example: 'Acme Inc',
  })
  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @ApiProperty({
    description: 'Organization email',
    example: 'contact@acme.com',
  })
  @IsEmail()
  organizationEmail: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@acme.com',
  })
  @IsEmail()
  userEmail: string;

  @ApiProperty({
    description: 'User password',
    minLength: 8,
    example: 'password',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
