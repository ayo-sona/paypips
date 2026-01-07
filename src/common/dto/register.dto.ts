import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Organization name',
    example: 'Life Fitness',
  })
  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @ApiProperty({
    description: 'Organization email',
    example: 'wibble@life.com',
  })
  @IsEmail()
  organizationEmail: string;

  @ApiProperty({
    description: 'User first name',
    example: 'Levi',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Ackerman',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'User email',
    example: 'levi@life.com',
  })
  @IsEmail()
  userEmail: string;

  @ApiProperty({
    description: 'User password',
    minLength: 8,
    example: 'password123',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
