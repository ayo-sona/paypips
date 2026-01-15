import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { MemberSubscription } from '../../database/entities/member-subscription.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { MemberPlan } from '../../database/entities/member-plan.entity';
import { Member } from '../../database/entities/member.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([MemberSubscription, Invoice, MemberPlan, Member]),
    NotificationsModule,
    AuthModule,
  ],
  controllers: [CronController],
  providers: [CronService],
  exports: [CronService],
})
export class CronModule {}
