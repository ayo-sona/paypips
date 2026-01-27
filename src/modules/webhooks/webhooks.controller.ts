import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  HttpCode,
  HttpStatus,
  type RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';
import { SkipThrottle } from '../../common/decorators/throttle-skip.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('webhooks')
@SkipThrottle()
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('paystack')
  @ApiOperation({ summary: 'Handle Paystack webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  @HttpCode(HttpStatus.OK)
  async handlePaystackWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() body: any,
    @Req() request: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing signature header');
    }

    // Get raw body for signature verification
    const rawBody = request.rawBody?.toString('utf8') || JSON.stringify(body);

    // Verify signature
    const isValid = this.webhooksService.verifyPaystackSignature(
      rawBody,
      signature,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    return await this.webhooksService.handlePaystackWebhook(body);
  }

  // @Post('stripe')
  // @ApiOperation({ summary: 'Stripe webhook handler' })
  // @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  // @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  // @HttpCode(HttpStatus.OK)
  // async handleWebhook(
  //   @Headers('stripe-signature') signature: string,
  //   @Req() request: RawBodyRequest<Request>,
  // ) {
  //   const payload = request.rawBody!;

  //   return await this.webhooksService.handleStripeWebhook(signature, payload);
  // }
}
