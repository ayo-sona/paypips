import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Customer } from '../../database/entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async create(organizationId: string, createCustomerDto: CreateCustomerDto) {
    // Check if customer already exists in this organization
    const existing = await this.customerRepository.findOne({
      where: {
        organization_id: organizationId,
        email: createCustomerDto.email,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Customer with this email already exists in your organization',
      );
    }

    const customer = this.customerRepository.create({
      organization_id: organizationId,
      email: createCustomerDto.email,
      first_name: createCustomerDto.firstName,
      last_name: createCustomerDto.lastName,
      phone: createCustomerDto.phone,
      metadata: createCustomerDto.metadata || {},
    });

    const saved = await this.customerRepository.save(customer);

    return {
      message: 'Customer created successfully',
      data: saved,
    };
  }

  async findAll(
    organizationId: string,
    paginationDto: PaginationDto,
    search?: string,
  ) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const whereCondition: any = { organization_id: organizationId };

    // Add search if provided
    if (search) {
      whereCondition.email = ILike(`%${search}%`);
    }

    const [customers, total] = await this.customerRepository.findAndCount({
      where: whereCondition,
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      message: 'Customers retrieved successfully',
      ...paginate(customers, total, page, limit),
    };
  }

  async findOne(organizationId: string, customerId: string) {
    const customer = await this.customerRepository.findOne({
      where: {
        id: customerId,
        organization_id: organizationId,
      },
      relations: ['subscriptions', 'subscriptions.plan'],
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return {
      message: 'Customer retrieved successfully',
      data: customer,
    };
  }

  async update(
    organizationId: string,
    customerId: string,
    updateCustomerDto: UpdateCustomerDto,
  ) {
    const customer = await this.customerRepository.findOne({
      where: {
        id: customerId,
        organization_id: organizationId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check if email is being changed and is unique
    if (updateCustomerDto.email && updateCustomerDto.email !== customer.email) {
      const existing = await this.customerRepository.findOne({
        where: {
          organization_id: organizationId,
          email: updateCustomerDto.email,
        },
      });

      if (existing) {
        throw new ConflictException('Email already in use by another customer');
      }
    }

    // Update fields
    if (updateCustomerDto.email) customer.email = updateCustomerDto.email;
    if (updateCustomerDto.firstName)
      customer.first_name = updateCustomerDto.firstName;
    if (updateCustomerDto.lastName)
      customer.last_name = updateCustomerDto.lastName;
    if (updateCustomerDto.phone !== undefined)
      customer.phone = updateCustomerDto.phone;
    if (updateCustomerDto.metadata) {
      customer.metadata = {
        ...customer.metadata,
        ...updateCustomerDto.metadata,
      };
    }

    const updated = await this.customerRepository.save(customer);

    return {
      message: 'Customer updated successfully',
      data: updated,
    };
  }

  async delete(organizationId: string, customerId: string) {
    const customer = await this.customerRepository.findOne({
      where: {
        id: customerId,
        organization_id: organizationId,
      },
      relations: ['subscriptions'],
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check for active subscriptions
    const hasActiveSubscriptions = customer.subscriptions?.some(
      (sub) => sub.status === 'active',
    );

    if (hasActiveSubscriptions) {
      throw new ConflictException(
        'Cannot delete customer with active subscriptions',
      );
    }

    await this.customerRepository.remove(customer);

    return {
      message: 'Customer deleted successfully',
    };
  }

  async getCustomerStats(organizationId: string, customerId: string) {
    const customer = await this.customerRepository.findOne({
      where: {
        id: customerId,
        organization_id: organizationId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Get subscription stats
    const [subscriptions, invoices, totalPaid] = await Promise.all([
      this.customerRepository.query(
        `SELECT COUNT(*) as count, status 
         FROM subscriptions 
         WHERE customer_id = $1 
         GROUP BY status`,
        [customerId],
      ),
      this.customerRepository.query(
        `SELECT COUNT(*) as count, status 
         FROM invoices 
         WHERE customer_id = $1 
         GROUP BY status`,
        [customerId],
      ),
      this.customerRepository.query(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM payments 
         WHERE customer_id = $1 AND status = 'success'`,
        [customerId],
      ),
    ]);

    return {
      message: 'Customer stats retrieved successfully',
      data: {
        subscriptions: subscriptions.reduce((acc, curr) => {
          acc[curr.status] = parseInt(curr.count);
          return acc;
        }, {}),
        invoices: invoices.reduce((acc, curr) => {
          acc[curr.status] = parseInt(curr.count);
          return acc;
        }, {}),
        totalPaid: parseFloat(totalPaid[0].total),
      },
    };
  }
}
