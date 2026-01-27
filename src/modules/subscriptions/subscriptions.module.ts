import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { MemberSubscription } from '../../database/entities/member-subscription.entity';
import { Member } from '../../database/entities/member.entity';
import { MemberPlan } from '../../database/entities/member-plan.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { OrganizationSubscription } from '../../database/entities/organization-subscription.entity';
import { OrganizationPlan } from '../../database/entities/organization-plan.entity';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrganizationUser } from 'src/database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MemberSubscription,
      Member,
      MemberPlan,
      Invoice,
      OrganizationSubscription,
      OrganizationPlan,
      OrganizationUser,
    ]),
    PaymentsModule,
    NotificationsModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
