import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaystackService } from './paystack.service';
import { Payment } from '../../database/entities/payment.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { Member } from '../../database/entities/member.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { MemberSubscription, OrganizationUser } from 'src/database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Invoice,
      Member,
      OrganizationUser,
      MemberSubscription,
    ]),
    NotificationsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaystackService],
  exports: [PaymentsService, PaystackService],
})
export class PaymentsModule {}
