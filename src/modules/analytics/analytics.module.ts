import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { MemberSubscription } from '../../database/entities/member-subscription.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { Payment } from '../../database/entities/payment.entity';
import { Member } from '../../database/entities/member.entity';
import { MemberPlan } from '../../database/entities/member-plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MemberSubscription,
      Invoice,
      Payment,
      Member,
      MemberPlan,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
