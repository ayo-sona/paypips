import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsEnum, MinLength } from 'class-validator';

enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  VIEWER = 'viewer',
}

export class InviteUserDto {
  @ApiProperty({
    description: 'User email',
    example: 'armin@life.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'Armin',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Arlet',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'User role',
    example: 'staff',
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'User password',
    minLength: 8,
    example: 'password123',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
