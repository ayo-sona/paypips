import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { Member } from '../../database/entities/member.entity';
import { OrganizationUser } from '../../database/entities/organization-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Member, OrganizationUser])],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
