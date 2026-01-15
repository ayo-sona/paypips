import { Module } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationInvite } from 'src/database/entities/organization-invite.entity';
import { OrganizationUser } from 'src/database/entities/organization-user.entity';
import { User } from 'src/database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrganizationInvite, OrganizationUser, User]),
    NotificationsModule,
    AuthModule,
  ],
  providers: [InvitationsService],
  controllers: [InvitationsController],
})
export class InvitationsModule {}
