import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class InviteStaffDto {
  @ApiProperty({
    description: 'Email address of the staff to invite',
    example: 'billy@life.com',
  })
  @IsEmail()
  @IsNotEmpty()
  staffEmail: string;
}
