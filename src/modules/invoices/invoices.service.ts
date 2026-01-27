import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Invoice } from '../../database/entities/invoice.entity';
import { Member } from '../../database/entities/member.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { generateInvoiceNumber } from '../../common/utils/invoice-number.util';
import { MemberSubscription } from '../../database/entities/member-subscription.entity';
import { InvoiceStatus } from 'src/common/enums/enums';
import { InvoiceBilledType } from 'src/common/enums/enums';
import { Organization, OrganizationSubscription } from 'src/database/entities';
import { CreateOrganizationInvoiceDto } from './dto/create-organization-invoice.dto';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,

    @InjectRepository(Member)
    private memberRepository: Repository<Member>,

    @InjectRepository(MemberSubscription)
    private memberSubscriptionRepository: Repository<MemberSubscription>,

    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,

    @InjectRepository(OrganizationSubscription)
    private organizationSubscriptionRepository: Repository<OrganizationSubscription>,
  ) {}

  async createMemberInvoice(
    organizationId: string,
    createInvoiceDto: CreateInvoiceDto,
  ) {
    // Verify member
    const member = await this.memberRepository.findOne({
      where: {
        id: createInvoiceDto.billedUserId,
        organization_user: {
          organization_id: organizationId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Verify subscription if provided
    if (createInvoiceDto.subscriptionId) {
      const subscription = await this.memberSubscriptionRepository.findOne({
        where: {
          id: createInvoiceDto.subscriptionId,
          organization_id: organizationId,
        },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }
    }

    // Create invoice
    const invoice = this.invoiceRepository.create({
      issuer_org_id: organizationId,
      billed_user_id: createInvoiceDto.billedUserId,
      billed_type: InvoiceBilledType.USER,
      member_subscription_id: createInvoiceDto.subscriptionId,
      invoice_number: generateInvoiceNumber(organizationId),
      amount: createInvoiceDto.amount,
      currency: createInvoiceDto.currency || 'NGN',
      status: InvoiceStatus.PENDING,
      due_date: createInvoiceDto.dueDate,
      metadata: createInvoiceDto.metadata || {},
    });

    const saved = await this.invoiceRepository.save(invoice);

    return {
      message: 'Member invoice created successfully',
      data: saved,
    };
  }

  async findAllMemberInvoices(
    organizationId: string,
    paginationDto: PaginationDto,
    status?: string,
  ) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const whereCondition: any = { issuer_org_id: organizationId };
    if (status) {
      whereCondition.status = status;
    }

    const [invoices, total] = await this.invoiceRepository.findAndCount({
      where: whereCondition,
      relations: ['billed_user', 'member_subscription', 'payments'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      message: 'All member invoices retrieved successfully',
      ...paginate(invoices, total, page, limit),
    };
  }

  async findMemberInvoice(organizationId: string, invoiceId: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: {
        id: invoiceId,
        issuer_org_id: organizationId,
      },
      relations: ['billed_user', 'member_subscription', 'payments'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return {
      message: 'Member invoice retrieved successfully',
      data: invoice,
    };
  }

  async getMemberSubscriptionInvoices(
    organizationId: string,
    subscriptionId: string,
    paginationDto: PaginationDto,
  ) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [invoices, total] = await this.invoiceRepository.findAndCount({
      where: {
        issuer_org_id: organizationId,
        member_subscription_id: subscriptionId,
      },
      relations: ['member_subscription', 'payments'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      message: 'Member subscription invoices retrieved successfully',
      ...paginate(invoices, total, page, limit),
    };
  }

  async getOverdueMemberInvoices(organizationId: string) {
    const now = new Date();

    const invoices = await this.invoiceRepository.find({
      where: {
        issuer_org_id: organizationId,
        status: In([InvoiceStatus.PENDING, InvoiceStatus.FAILED]),
        due_date: LessThan(now),
      },
      relations: ['billed_user'],
      order: { due_date: 'ASC' },
    });

    return {
      message: 'Overdue member invoices retrieved successfully',
      data: invoices,
      count: invoices.length,
    };
  }

  async markMemberInvoiceAsPaid(organizationId: string, invoiceId: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: {
        id: invoiceId,
        issuer_org_id: organizationId,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice already paid');
    }

    invoice.status = InvoiceStatus.PAID;
    invoice.paid_at = new Date();
    await this.invoiceRepository.save(invoice);

    return {
      message: 'Member invoice marked as paid',
      data: invoice,
    };
  }

  async cancelMemberInvoice(organizationId: string, invoiceId: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: {
        id: invoiceId,
        issuer_org_id: organizationId,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot cancel paid invoice');
    }

    invoice.status = InvoiceStatus.CANCELLED;
    await this.invoiceRepository.save(invoice);

    return {
      message: 'Member invoice canceled successfully',
      data: invoice,
    };
  }

  async getMembersInvoiceStats(organizationId: string) {
    const [
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenue,
    ] = await Promise.all([
      this.invoiceRepository.count({
        where: { issuer_org_id: organizationId },
      }),
      this.invoiceRepository.count({
        where: { issuer_org_id: organizationId, status: InvoiceStatus.PAID },
      }),
      this.invoiceRepository.count({
        where: { issuer_org_id: organizationId, status: InvoiceStatus.PENDING },
      }),
      this.invoiceRepository.count({
        where: {
          issuer_org_id: organizationId,
          status: In([InvoiceStatus.PENDING, InvoiceStatus.FAILED]),
          due_date: LessThan(new Date()),
        },
      }),
      this.invoiceRepository.query(
        `SELECT COALESCE(SUM(amount), 0) as total
           FROM invoices
           WHERE issuer_org_id = $1 AND status = $2`,
        [organizationId, InvoiceStatus.PAID],
      ),
    ]);

    return {
      message: 'Member invoice stats retrieved successfully',
      data: {
        total_invoices: totalInvoices,
        paid_invoices: paidInvoices,
        pending_invoices: pendingInvoices,
        overdue_invoices: overdueInvoices,
        cancelled_invoices:
          totalInvoices - paidInvoices - pendingInvoices - overdueInvoices,
        total_revenue: parseFloat(totalRevenue[0].total),
      },
    };
  }

  /**
   * Get a single organization invoice by ID
   */
  async getOrganizationInvoice(
    organizationId: string,
    invoiceId: string,
  ): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: {
        id: invoiceId,
        issuer_org_id: organizationId,
        billed_type: InvoiceBilledType.ORGANIZATION,
      },
      relations: [
        'organization_subscription',
        'organization_subscription.plan',
      ],
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  /**
   * Get a single organization invoices
   */
  async getOrganizationInvoices(organizationId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: {
        issuer_org_id: organizationId,
        billed_type: InvoiceBilledType.ORGANIZATION,
      },
      relations: [
        'organization_subscription',
        'organization_subscription.plan',
      ],
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  /**
   * Create a new invoice for an organization
   */
  async createOrganizationInvoice(
    organizationId: string,
    createInvoiceDto: CreateOrganizationInvoiceDto,
  ): Promise<Invoice> {
    // Verify organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    // If subscription ID is provided, verify it exists and belongs to the organization
    let subscription: OrganizationSubscription | null = null;
    if (createInvoiceDto.subscriptionId) {
      subscription = await this.organizationSubscriptionRepository.findOne({
        where: {
          id: createInvoiceDto.subscriptionId,
          organization_id: organizationId,
        },
      });
      if (!subscription) {
        throw new BadRequestException('Invalid subscription ID');
      }
    }
    const invoice = this.invoiceRepository.create({
      issuer_org_id: organizationId,
      organization_subscription_id: createInvoiceDto.subscriptionId,
      billed_type: InvoiceBilledType.ORGANIZATION,
      invoice_number: `INV-ORG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      amount: createInvoiceDto.amount,
      currency: createInvoiceDto.currency || 'NGN',
      status: createInvoiceDto.status || InvoiceStatus.PENDING,
      due_date: createInvoiceDto.dueDate || new Date(),
      description: createInvoiceDto.description,
      metadata: {
        ...createInvoiceDto.metadata,
      },
    });
    return this.invoiceRepository.save(invoice);
  }

  /**
   * Get all overdue organization invoices
   */
  async getOverdueOrgInvoices(
    organizationId: string,
  ): Promise<{ data: Invoice[]; count: number }> {
    const now = new Date();
    const [invoices, count] = await this.invoiceRepository.findAndCount({
      where: {
        issuer_org_id: organizationId,
        billed_type: InvoiceBilledType.ORGANIZATION,
        status: In([InvoiceStatus.PENDING, InvoiceStatus.FAILED]),
        due_date: LessThan(now),
      },
      relations: ['organization_subscription'],
      order: { due_date: 'ASC' },
    });
    return {
      data: invoices,
      count,
    };
  }

  /**
   * Get organization invoice statistics
   */
  async getOrganizationsInvoiceStats(organizationId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Get total paid amount
    const totalPaid = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amount)', 'total')
      .where('invoice.issuer_org_id = :orgId', { orgId: organizationId })
      .andWhere('invoice.status = :status', { status: InvoiceStatus.PAID })
      .getRawOne();

    // Get pending amount
    const pendingInvoices = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amount)', 'total')
      .where('invoice.issuer_org_id = :orgId', { orgId: organizationId })
      .andWhere('invoice.status = :status', { status: InvoiceStatus.PENDING })
      .andWhere('invoice.due_date >= :now', { now })
      .getRawOne();

    // Get failed amount
    // const failedInvoices = await this.invoiceRepository
    //   .createQueryBuilder('invoice')
    //   .select('SUM(invoice.amount)', 'total')
    //   .where('invoice.issuer_org_id = :orgId', { orgId: organizationId })
    //   .andWhere('invoice.status = :status', { status: InvoiceStatus.FAILED })
    //   .andWhere('invoice.due_date < :now', { now })
    //   .getRawOne();

    // Get monthly revenue for the last 30 days
    const monthlyRevenue = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select([
        "TO_CHAR(invoice.paid_at, 'YYYY-MM-DD') as day",
        'SUM(invoice.amount) as amount',
      ])
      .where('invoice.issuer_org_id = :orgId', { orgId: organizationId })
      .andWhere('invoice.status = :status', { status: InvoiceStatus.PAID })
      .andWhere('invoice.paid_at >= :date', { date: thirtyDaysAgo })
      .groupBy("TO_CHAR(invoice.paid_at, 'YYYY-MM-DD')")
      .orderBy('day', 'ASC')
      .getRawMany();

    return {
      totalPaid: parseFloat(totalPaid?.total || 0),
      pendingAmount: parseFloat(pendingInvoices?.total || 0),
      monthlyRevenue: monthlyRevenue.map((item) => ({
        day: item.day,
        amount: parseFloat(item.amount),
      })),
    };
  }
}
