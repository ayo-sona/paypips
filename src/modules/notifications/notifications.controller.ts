import { Controller, Post, Body, Logger, Get } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';
import { type EmailOptions } from './interfaces/notification.interface';
// import { type SmsOptions } from './interfaces/notification.interface';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  @Get('test-email')
  @ApiOperation({ summary: 'Test email configuration' })
  async testEmail() {
    const testEmail = this.configService.get('smtp.fromEmail');
    const testRecipient = 'elijah.usih@stu.cu.edu.ng';

    try {
      const result = await this.emailService.sendEmail({
        to: testRecipient,
        subject: 'Test Email from Willow',
        template: 'test',
        context: { test: true },
      });

      this.logger.log(`Test email sent to ${testRecipient}`);
      return {
        success: result,
        message: result
          ? 'Test email sent successfully'
          : 'Failed to send test email',
        testEmail,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Test email failed', error.stack);
      return {
        success: false,
        message: 'Failed to send test email',
        error: error.message,
        testEmail,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('email/welcome')
  @ApiOperation({ summary: 'Send a welcome email' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        to: { type: 'string', example: 'user@example.com' },
        context: {
          type: 'object',
          example: { userName: 'John Doe', organizationName: 'Willow' },
        },
      },
    },
  })
  async sendWelcomeEmail(@Body() emailOptions: EmailOptions) {
    this.logger.log('Sending welcome email');
    try {
      await this.notificationsService.sendWelcomeEmail({
        email: emailOptions.to,
        userName: emailOptions.context?.userName || 'User',
        organizationName: emailOptions.context?.organizationName || 'Willow',
      });
      return { success: true, message: 'Welcome email sent successfully' };
    } catch (error) {
      this.logger.error('Failed to send welcome email', error.stack);
      throw error;
    }
  }

  //   @Post('sms/test')
  //   @ApiOperation({ summary: 'Send a test SMS' })
  //   @ApiResponse({ status: 200, description: 'SMS sent successfully' })
  //   @ApiResponse({ status: 400, description: 'Bad Request' })
  //   async sendTestSms(@Body() smsOptions: SmsOptions) {
  //     this.logger.log('Sending test SMS');
  //     try {
  //       await this.notificationsService.sendSms({
  //         to: smsOptions.to,
  //         message: smsOptions.message || 'This is a test SMS from Willow',
  //       });
  //       return { success: true, message: 'Test SMS sent successfully' };
  //     } catch (error) {
  //       this.logger.error('Failed to send test SMS', error.stack);
  //       throw error;
  //     }
  //   }

  //   @Post('welcome')
  //   @ApiOperation({ summary: 'Send welcome email' })
  //   async sendWelcomeEmail(
  //     @Body() body: { email: string; name: string; organizationName: string },
  //   ) {
  //     return this.notificationsService.sendWelcomeEmail({
  //       email: body.email,
  //       userName: body.name,
  //       organizationName: body.organizationName,
  //     });
  //   }

  //   @Post('payment/success')
  //   @ApiOperation({ summary: 'Send payment success notification' })
  //   async sendPaymentSuccess(
  //     @Body()
  //     body: {
  //       email: string;
  //       amount: number;
  //       reference: string;
  //       date: string;
  //     },
  //   ) {
  //     return this.notificationsService.sendPaymentSuccess({
  //       email: body.email,
  //       amount: body.amount,
  //       reference: body.reference,
  //       date: new Date(body.date),
  //     });
  //   }

  //   @Post('payment/failed')
  //   @ApiOperation({ summary: 'Send payment failure notification' })
  //   async sendPaymentFailed(
  //     @Body()
  //     body: {
  //       email: string;
  //       amount: number;
  //       reason: string;
  //       retryUrl: string;
  //     },
  //   ) {
  //     return this.notificationsService.sendPaymentFailed({
  //       email: body.email,
  //       amount: body.amount,
  //       reason: body.reason,
  //       retryUrl: body.retryUrl,
  //     });
  //   }
}
