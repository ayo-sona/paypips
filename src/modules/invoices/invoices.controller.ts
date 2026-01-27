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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiPropertyOptional,
  ApiResponse,
} from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateOrganizationInvoiceDto } from './dto/create-organization-invoice.dto';
import { Invoice } from 'src/database/entities/invoice.entity';

class StatusDto {
  @ApiPropertyOptional({
    description: 'Invoice status',
    enum: ['pending', 'paid', 'cancelled', 'failed'],
  })
  @IsString()
  @IsOptional()
  status?: string;
}

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
    // @Query() paginationDto: PaginationDto,
    @Query()
    paginationDto: {
      page?: number;
      limit?: number;
    },
    @Query() statusDto: StatusDto,
  ) {
    console.log('status', statusDto.status);
    return this.invoicesService.findAllMemberInvoices(
      organizationId,
      paginationDto,
      statusDto.status,
    );
  }

  @Get('member/all/stats')
  @ApiOperation({ summary: 'Get all members invoice stats' })
  @ApiResponse({ status: 200, description: 'Member invoice stats' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getStats(@CurrentOrganization() organizationId: string) {
    return this.invoicesService.getMembersInvoiceStats(organizationId);
  }

  @Get('member/all/overdue')
  @ApiOperation({ summary: 'Get all overdue member invoices' })
  @ApiResponse({ status: 200, description: 'List of overdue member invoices' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getOverdue(@CurrentOrganization() organizationId: string) {
    return this.invoicesService.getOverdueMemberInvoices(organizationId);
  }

  @Get('member/subscription/:subscriptionId')
  @ApiOperation({ summary: 'Get member subscription invoices' })
  @ApiResponse({
    status: 200,
    description: 'List of member subscription invoices',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getMemberSubscriptionInvoices(
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

  @Get('member/:invoiceId')
  @ApiOperation({ summary: 'Get invoice by id' })
  @ApiResponse({ status: 200, description: 'Invoice' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findOne(
    @CurrentOrganization() organizationId: string,
    @Param('invoiceId') id: string,
  ) {
    return this.invoicesService.findMemberInvoice(organizationId, id);
  }

  @Patch('member/:invoiceId/mark-paid')
  @ApiOperation({ summary: 'Mark invoice as paid' })
  @ApiResponse({ status: 200, description: 'Invoice marked as paid' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  markAsPaid(
    @CurrentOrganization() organizationId: string,
    @Param('invoiceId') id: string,
  ) {
    return this.invoicesService.markMemberInvoiceAsPaid(organizationId, id);
  }

  @Patch('member/:invoiceId/cancel')
  @ApiOperation({ summary: 'Cancel invoice' })
  @ApiResponse({ status: 200, description: 'Invoice canceled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  cancel(
    @CurrentOrganization() organizationId: string,
    @Param('invoiceId') id: string,
  ) {
    return this.invoicesService.cancelMemberInvoice(organizationId, id);
  }

  @Get('organization/overdue')
  @ApiOperation({ summary: 'Get all overdue organization invoices' })
  @ApiResponse({
    status: 200,
    description: 'Overdue invoices retrieved successfully',
  })
  async getOverdueInvoices(@CurrentOrganization() organizationId: string) {
    return this.invoicesService.getOverdueOrgInvoices(organizationId);
  }

  @Get('organiation/stats')
  @ApiOperation({ summary: 'Get organization invoice statistics' })
  @ApiResponse({
    status: 200,
    description: 'Invoice statistics retrieved successfully',
  })
  async getInvoiceStats(@CurrentOrganization() organizationId: string) {
    return this.invoicesService.getOrganizationsInvoiceStats(organizationId);
  }

  @Get('/organization/:invoiceId')
  @ApiOperation({ summary: 'Get organization invoice by ID' })
  @ApiResponse({
    status: 200,
    description: 'Invoice retrieved successfully',
    type: Invoice,
  })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoice(
    @CurrentOrganization() organizationId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.invoicesService.getOrganizationInvoice(
      organizationId,
      invoiceId,
    );
  }

  @Get('/organization')
  @ApiOperation({ summary: 'Get all organization invoices' })
  @ApiResponse({
    status: 200,
    description: 'Invoices retrieved successfully',
    type: [Invoice],
  })
  @ApiResponse({ status: 404, description: 'Invoices not found' })
  async getInvoices(@CurrentOrganization() organizationId: string) {
    return this.invoicesService.getOrganizationInvoices(organizationId);
  }

  @Post('/organization')
  @ApiOperation({ summary: 'Create a new organization invoice' })
  @ApiResponse({
    status: 201,
    description: 'Invoice created successfully',
    type: Invoice,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createInvoice(
    @CurrentOrganization() organizationId: string,
    @Body() createInvoiceDto: CreateOrganizationInvoiceDto,
  ) {
    return this.invoicesService.createOrganizationInvoice(
      organizationId,
      createInvoiceDto,
    );
  }
}
