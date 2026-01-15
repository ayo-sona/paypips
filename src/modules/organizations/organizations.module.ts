import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { Organization } from '../../database/entities/organization.entity';
import { User } from '../../database/entities/user.entity';
import { MemberPlan } from 'src/database/entities';
import { OrganizationUser } from 'src/database/entities/organization-user.entity';
import { OrganizationInvite } from 'src/database/entities/organization-invite.entity';
import { Member } from 'src/database/entities/member.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      User,
      MemberPlan,
      OrganizationUser,
      OrganizationInvite,
      Member,
    ]),
    AuthModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
