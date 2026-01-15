import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentOrganization } from '../../common/decorators/organization.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('invoices')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('member')
  @ApiOperation({ summary: 'Create a new member invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  create(
    @CurrentOrganization() organizationId: string,
    @Body() createInvoiceDto: CreateInvoiceDto,
  ) {
    return this.invoicesService.createMemberInvoice(
      organizationId,
      createInvoiceDto,
    );
  }

  @Get('member')
  @ApiOperation({ summary: 'Get all member invoices' })
  @ApiResponse({ status: 200, description: 'List of member invoices' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @CurrentOrganization() organizationId: string,
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.invoicesService.findAllMemberInvoices(
      organizationId,
      paginationDto,
      status,
    );
  }

  @Get('member/stats')
  @ApiOperation({ summary: 'Get member invoice stats' })
  @ApiResponse({ status: 200, description: 'Member invoice stats' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getStats(@CurrentOrganization() organizationId: string) {
    return this.invoicesService.getMembersInvoiceStats(organizationId);
  }

  @Get('member/overdue')
  @ApiOperation({ summary: 'Get overdue invoices' })
  @ApiResponse({ status: 200, description: 'List of overdue invoices' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getOverdue(@CurrentOrganization() organizationId: string) {
    return this.invoicesService.getOverdueMemberInvoices(organizationId);
  }

  @Get('member/:subscriptionId')
  @ApiOperation({ summary: 'Get member invoices' })
  @ApiResponse({ status: 200, description: 'List of member invoices' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getMemberInvoices(
    @CurrentOrganization() organizationId: string,
    @Param('subscriptionId') subscriptionId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.invoicesService.getMemberSubscriptionInvoices(
      organizationId,
      subscriptionId,
      paginationDto,
    );
  }

  @Get('member/:id')
  @ApiOperation({ summary: 'Get invoice by id' })
  @ApiResponse({ status: 200, description: 'Invoice' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findOne(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.invoicesService.findMemberInvoice(organizationId, id);
  }

  @Patch('member/:id/mark-paid')
  @ApiOperation({ summary: 'Mark invoice as paid' })
  @ApiResponse({ status: 200, description: 'Invoice marked as paid' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  markAsPaid(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.invoicesService.markMemberInvoiceAsPaid(organizationId, id);
  }

  @Patch('member/:id/cancel')
  @ApiOperation({ summary: 'Cancel invoice' })
  @ApiResponse({ status: 200, description: 'Invoice canceled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  cancel(
    @CurrentOrganization() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.invoicesService.cancelMemberInvoice(organizationId, id);
  }
}
