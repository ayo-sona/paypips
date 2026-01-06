import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { Subscription } from '../../database/entities/subscription.entity';
import { Customer } from '../../database/entities/customer.entity';
import { Plan } from '../../database/entities/plan.entity';
import { Invoice } from '../../database/entities/invoice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, Customer, Plan, Invoice])],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
