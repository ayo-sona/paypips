import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { Payment } from '../../database/entities/payment.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { MemberSubscription } from '../../database/entities/member-subscription.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrganizationSubscription } from 'src/database/entities';
import { Stripe } from 'stripe';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Invoice,
      MemberSubscription,
      OrganizationSubscription,
    ]),
    NotificationsModule,
  ],
  controllers: [WebhooksController],
  providers: [
    WebhooksService,
    {
      provide: 'STRIPE',
      useFactory: (configService: ConfigService) => {
        const stripeKey = configService.get<string>('stripe.testSecretKey');
        if (!stripeKey) {
          throw new Error(
            'STRIPE_TEST_SECRET_KEY is not defined in the configuration',
          );
        }
        return new Stripe(stripeKey, {
          apiVersion: '2025-12-15.clover',
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class WebhooksModule {}
