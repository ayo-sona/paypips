// import {
//   Controller,
//   Post,
//   Get,
//   Delete,
//   Body,
//   Param,
//   UseGuards,
//   Req,
// } from '@nestjs/common';
// import { StripeService } from './stripe.service';
// import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
// import { CurrentUser } from 'src/common/decorators/current-user.decorator';
// import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
// // import { Request } from 'express';

// @ApiTags('Stripe')
// @Controller('stripe')
// export class StripeController {
//   constructor(private readonly stripeService: StripeService) {}

//   // ==========================================
//   // PAYMENT METHOD ENDPOINTS
//   // ==========================================

//   @Post('create-setup-intent')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Create setup intent for adding payment method' })
//   async createSetupIntent(@CurrentUser() user: any) {
//     const setupIntent = await this.stripeService.createSetupIntent(
//       user.currentOrganization,
//       user.id,
//     );

//     return {
//       message: 'Setup intent created',
//       data: {
//         clientSecret: setupIntent.clientSecret,
//       },
//     };
//   }

//   @Get('payment-methods')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Get all payment methods' })
//   async getPaymentMethods(@CurrentUser() user: any) {
//     const paymentMethods = await this.stripeService.getPaymentMethods(
//       user.currentOrganization,
//       user.id,
//     );

//     return {
//       message: 'Payment methods retrieved',
//       data: paymentMethods,
//     };
//   }

//   @Post('payment-history')
//   async getPaymentHistory(@CurrentUser() user: any, @Param() limit?: number) {
//     return this.stripeService.getPaymentHistory(
//       user.currentOrganization,
//       user.id,
//       limit,
//     );
//   }

//   @Post('payment-methods/:paymentMethodId/default')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Set default payment method' })
//   async setDefaultPaymentMethod(
//     @CurrentUser() user: any,
//     @Param('paymentMethodId') paymentMethodId: string,
//   ) {
//     const result = await this.stripeService.setDefaultPaymentMethod(
//       user.currentOrganization,
//       user.id,
//       paymentMethodId,
//     );

//     return result;
//   }

//   @Delete('payment-methods/:paymentMethodId')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Remove payment method' })
//   async removePaymentMethod(@Param('paymentMethodId') paymentMethodId: string) {
//     await this.stripeService.detachPaymentMethod(paymentMethodId);

//     return {
//       message: 'Payment method removed',
//     };
//   }

//   // ==========================================
//   // BILLING & INVOICES
//   // ==========================================

//   @Get('invoices')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Get all invoices' })
//   async getInvoices(@CurrentUser() user: any) {
//     const invoices = await this.stripeService.getStripeInvoices(
//       user.currentOrganization,
//       user.id,
//     );

//     return {
//       message: 'Invoices retrieved',
//       data: invoices,
//     };
//   }

//   //   @Get('upcoming-invoice')
//   //   @UseGuards(JwtAuthGuard)
//   //   @ApiBearerAuth('JWT-auth')
//   //   @ApiOperation({ summary: 'Get upcoming invoice preview' })
//   //   async getUpcomingInvoice(@CurrentUser() user: any) {
//   //     const invoice = await this.stripeService.getUpcomingInvoice(
//   //       user.currentOrganization,
//   //       user.id,
//   //     );

//   //     return {
//   //       message: 'Upcoming invoice retrieved',
//   //       data: invoice,
//   //     };
//   //   }

//   // ==========================================
//   // CUSTOMER MANAGEMENT
//   // ==========================================

//   @Post('customer')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Create Stripe customer' })
//   async createCustomer(@CurrentUser() user: any) {
//     const customer = await this.stripeService.createCustomer(
//       user.currentOrganization,
//       user.id,
//       user.email,
//     );

//     return {
//       message: 'Customer created successfully',
//       data: customer,
//     };
//   }

//   @Get('customer')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Get Stripe customer' })
//   async getCustomer(@CurrentUser() user: any) {
//     const customer = await this.stripeService.getOrCreateCustomer(
//       user.currentOrganization,
//       user.id,
//     );

//     return {
//       message: 'Customer retrieved',
//       data: customer,
//     };
//   }

//   // ==========================================
//   // PAYMENT PROCESSING
//   // ==========================================

//   @Post('payment-intent/invoice/:invoiceId')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Create payment intent for invoice' })
//   async createPaymentIntent(
//     @CurrentUser() user: any,
//     @Param('invoiceId') invoiceId: string,
//   ) {
//     const result = await this.stripeService.createPaymentIntentForInvoice(
//       invoiceId,
//       user.id,
//     );

//     return {
//       message: 'Payment intent created',
//       data: result,
//     };
//   }

//   @Post('charge-invoice/:invoiceId')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Charge saved payment method for invoice' })
//   async chargeInvoice(
//     @CurrentUser() user: any,
//     @Param('invoiceId') invoiceId: string,
//     @Body() body: { paymentMethodId?: string },
//   ) {
//     const result = await this.stripeService.chargePaymentMethod(
//       user.currentOrganization,
//       user.id,
//       invoiceId,
//       body.paymentMethodId,
//     );

//     return {
//       message: result.success ? 'Payment successful' : 'Payment processing',
//       data: result,
//     };
//   }

//   @Get('payment-intent/:paymentIntentId')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Get payment intent details' })
//   async getPaymentIntent(@Param('paymentIntentId') paymentIntentId: string) {
//     const paymentIntent =
//       await this.stripeService.getPaymentIntent(paymentIntentId);

//     return {
//       message: 'Payment intent retrieved',
//       data: paymentIntent,
//     };
//   }

//   @Post('payment-intent/:paymentIntentId/cancel')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Cancel payment intent' })
//   async cancelPaymentIntent(@Param('paymentIntentId') paymentIntentId: string) {
//     const result =
//       await this.stripeService.cancelPaymentIntent(paymentIntentId);

//     return {
//       message: 'Payment intent canceled',
//       data: result,
//     };
//   }

//   // ==========================================
//   // REFUNDS
//   // ==========================================

//   @Post('refund/:paymentId')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Create refund for payment' })
//   async createRefund(
//     @Param('paymentId') paymentId: string,
//     @Body() body: { amount?: number; reason?: string },
//   ) {
//     const refund = await this.stripeService.createRefund(
//       paymentId,
//       body.amount,
//       body.reason,
//     );

//     return {
//       message: 'Refund created',
//       data: refund,
//     };
//   }

//   @Get('refund/:refundId')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Get refund details' })
//   async getRefund(@Param('refundId') refundId: string) {
//     const refund = await this.stripeService.getRefund(refundId);

//     return {
//       message: 'Refund retrieved',
//       data: refund,
//     };
//   }

//   // ==========================================
//   // DISPUTES
//   // ==========================================

//   @Get('disputes')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Get disputes' })
//   async getDisputes(@CurrentUser() user: any) {
//     const disputes = await this.stripeService.getDisputes(
//       user.organization_id,
//       user.id,
//     );

//     return {
//       message: 'Disputes retrieved',
//       data: disputes,
//     };
//   }

//   @Post('disputes/:disputeId/evidence')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Submit dispute evidence' })
//   async submitDisputeEvidence(
//     @Param('disputeId') disputeId: string,
//     @Body() evidence: any,
//   ) {
//     const result = await this.stripeService.submitDisputeEvidence(
//       disputeId,
//       evidence,
//     );

//     return {
//       message: 'Evidence submitted',
//       data: result,
//     };
//   }
// }
