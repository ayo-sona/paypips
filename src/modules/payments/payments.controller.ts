import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentOrganization } from '../../common/decorators/organization.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('payments')
@ApiBearerAuth('JWT-auth')
@Throttle({ short: { limit: 20, ttl: 60000 } })
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize a payment' })
  @ApiResponse({ status: 200, description: 'Payment initialized successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  initializePayment(
    @CurrentUser() user: any,
    @CurrentOrganization() organizationId: string,
    @Body() initializePaymentDto: InitializePaymentDto,
  ) {
    return this.paymentsService.initializePayment(
      organizationId,
      initializePaymentDto,
      user.id,
    );
  }

  @Get('verify/:reference')
  @ApiOperation({ summary: 'Verify a payment' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  verifyPayment(
    @CurrentOrganization() organizationId: string,
    @Param('reference') reference: string,
  ) {
    return this.paymentsService.verifyPayment(organizationId, reference);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findAll(
    @CurrentOrganization() organizationId: string,
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.findAll(organizationId, paginationDto, status);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get payment stats' })
  @ApiResponse({
    status: 200,
    description: 'Payment stats retrieved successfully',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getStats(@CurrentOrganization() organizationId: string) {
    return this.paymentsService.getMemberPaymentStats(organizationId);
  }

  @Get('member/:userId')
  @ApiOperation({ summary: 'Get member payments' })
  @ApiResponse({
    status: 200,
    description: 'Member payments retrieved successfully',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getMemberPayments(
    @CurrentOrganization() organizationId: string,
    @Param('userId') userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.paymentsService.getPaymentsByMember(
      organizationId,
      userId,
      paginationDto,
    );
  }

  @Get(':paymentId')
  @ApiOperation({ summary: 'Get a payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findOne(
    @CurrentOrganization() organizationId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentsService.findOne(organizationId, paymentId);
  }
}
