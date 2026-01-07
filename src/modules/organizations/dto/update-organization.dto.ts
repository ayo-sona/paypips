import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrganizationDto {
  @ApiProperty({ description: 'Organization name', example: 'Life Fitness' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Organization email',
    example: 'wibble@life.com',
  })
  @IsEmail()
  email?: string;
}
