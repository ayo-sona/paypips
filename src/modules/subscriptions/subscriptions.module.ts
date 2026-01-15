import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { MemberSubscription } from '../../database/entities/member-subscription.entity';
import { Member } from '../../database/entities/member.entity';
import { MemberPlan } from '../../database/entities/member-plan.entity';
import { Invoice } from '../../database/entities/invoice.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MemberSubscription, Member, MemberPlan, Invoice]),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
