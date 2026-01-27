// import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
// import { StripeService } from './stripe.service';
// import { StripeController } from './stripe.controller';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Organization } from 'src/database/entities/organization.entity';
// import { MemberSubscription } from 'src/database/entities/member-subscription.entity';
// import { Payment } from 'src/database/entities/payment.entity';
// import { Invoice } from 'src/database/entities/invoice.entity';
// import {
//   OrganizationSubscription,
//   OrganizationUser,
//   User,
// } from 'src/database/entities';

// @Module({
//   imports: [
//     ConfigModule,
//     TypeOrmModule.forFeature([
//       Organization,
//       MemberSubscription,
//       Payment,
//       Invoice,
//       User,
//       OrganizationSubscription,
//       OrganizationUser,
//     ]),
//   ],
//   controllers: [StripeController],
//   providers: [StripeService],
//   exports: [StripeService],
// })
// export class StripeModule {}
