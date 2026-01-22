import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
// import { Organization } from 'src/database/entities/organization.entity';
import {
  Payment,
  PaymentPayerType,
  PaymentProvider,
  PaymentStatus,
} from 'src/database/entities/payment.entity';
import { Invoice, InvoiceStatus } from 'src/database/entities/invoice.entity';
import { User } from 'src/database/entities/user.entity';
import { OrganizationUser } from 'src/database/entities';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,

    @InjectRepository(OrganizationUser)
    private organizationUserRepository: Repository<OrganizationUser>,

    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,

    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('stripe.testSecretKey')!,
      {
        apiVersion: '2025-12-15.clover',
      },
    );
  }

  // ==========================================
  // CUSTOMER MANAGEMENT
  // ==========================================

  /**
   * Create a Stripe customer for an organization
   */
  async createCustomer(organizationId: string, userId: string, email: string) {
    const organizationUser = await this.organizationUserRepository.findOne({
      where: { organization_id: organizationId, user_id: userId },
      relations: ['organization'],
    });

    if (!organizationUser) {
      throw new BadRequestException('Organization not found');
    }

    // Check if customer already exists
    if (organizationUser.stripe_customer_id) {
      return await this.stripe.customers.retrieve(
        organizationUser.stripe_customer_id,
      );
    }

    // Create Stripe customer
    const customer = await this.stripe.customers.create({
      email,
      name: `${organizationUser.user.first_name} ${organizationUser.user.last_name}`,
      metadata: {
        organization_id: organizationId,
        organization_slug: organizationUser.organization.slug,
      },
    });

    // Update organization with Stripe customer ID
    organizationUser.stripe_customer_id = customer.id;
    await this.organizationUserRepository.save(organizationUser);

    return customer;
  }

  /**
   * Get existing customer or create new one
   */
  async getOrCreateCustomer(organizationId: string, userId: string) {
    const organizationUser = await this.organizationUserRepository.findOne({
      where: { organization_id: organizationId, user_id: userId },
      relations: ['user'],
    });

    if (!organizationUser) {
      throw new NotFoundException('Organization not found');
    }

    if (organizationUser.stripe_customer_id) {
      return await this.stripe.customers.retrieve(
        organizationUser.stripe_customer_id,
      );
    }

    return await this.createCustomer(
      organizationId,
      organizationUser.user.id,
      organizationUser.user.email,
    );
  }

  /**
   * Update customer details
   */
  async updateCustomer(
    organizationId: string,
    userId: string,
    updates: Stripe.CustomerUpdateParams,
  ) {
    const organizationUser = await this.organizationUserRepository.findOne({
      where: { organization_id: organizationId, user_id: userId },
    });

    if (!organizationUser?.stripe_customer_id) {
      throw new BadRequestException('Customer not found');
    }

    return await this.stripe.customers.update(
      organizationUser.stripe_customer_id,
      updates,
    );
  }

  /**
   * Delete customer
   */
  async deleteCustomer(organizationId: string, userId: string) {
    const organizationUser = await this.organizationUserRepository.findOne({
      where: { organization_id: organizationId, user_id: userId },
    });

    if (!organizationUser?.stripe_customer_id) {
      throw new BadRequestException('Customer not found');
    }

    await this.stripe.customers.del(organizationUser.stripe_customer_id);

    organizationUser.stripe_customer_id = null;
    await this.organizationUserRepository.save(organizationUser);

    return { message: 'Customer deleted successfully' };
  }

  // ==========================================
  // PAYMENT METHODS (CARD MANAGEMENT)
  // ==========================================

  /**
   * Create setup intent for adding a payment method
   */
  async createSetupIntent(organizationId: string, userId: string) {
    const customer = await this.getOrCreateCustomer(organizationId, userId);

    const setupIntent = await this.stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session', // Allow charging without customer present
    });

    return {
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    };
  }

  /**
   * Get all payment methods for a customer
   */
  async getPaymentMethods(organizationId: string, userId: string) {
    const organizationUser = await this.organizationUserRepository.findOne({
      where: { organization_id: organizationId, user_id: userId },
    });

    if (!organizationUser?.stripe_customer_id) {
      return [];
    }

    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: organizationUser.stripe_customer_id,
      type: 'card',
    });

    return paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      exp_month: pm.card?.exp_month,
      exp_year: pm.card?.exp_year,
      isDefault: pm.id === organizationUser.stripe_default_payment_method,
    }));
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(
    organizationId: string,
    userId: string,
    paymentMethodId: string,
  ) {
    const organizationUser = await this.organizationUserRepository.findOne({
      where: { organization_id: organizationId, user_id: userId },
    });

    if (!organizationUser?.stripe_customer_id) {
      throw new BadRequestException('Customer not found');
    }

    // Set as default in Stripe
    await this.stripe.customers.update(organizationUser.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Update in database
    organizationUser.stripe_default_payment_method = paymentMethodId;
    await this.organizationUserRepository.save(organizationUser);

    return { message: 'Default payment method updated' };
  }

  /**
   * Remove (detach) payment method
   */
  async detachPaymentMethod(paymentMethodId: string) {
    return await this.stripe.paymentMethods.detach(paymentMethodId);
  }

  // ==========================================
  // PAYMENT PROCESSING
  // ==========================================

  /**
   * Create payment intent for invoice payment
   * This is used for one-time payments for your invoices
   */
  async createPaymentIntentForInvoice(invoiceId: string, payerUserId: string) {
    // Get invoice details
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['issuer_org', 'billed_user'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice already paid');
    }

    // Get or create customer
    const customer = await this.getOrCreateCustomer(
      invoice.issuer_org_id,
      payerUserId,
    );

    // Create payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(invoice.amount * 100), // Convert to cents
      currency: invoice.currency.toLowerCase(),
      customer: customer.id,
      metadata: {
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
        organization_id: invoice.issuer_org_id,
        payer_user_id: payerUserId,
      },
      description:
        invoice.description || `Payment for invoice ${invoice.invoice_number}`,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never', // Prevent redirects for better UX
      },
    });

    // Create payment record in your database
    const payment = this.paymentRepository.create({
      invoice_id: invoiceId,
      payer_type:
        invoice.billed_type === 'user'
          ? PaymentPayerType.USER
          : PaymentPayerType.ORGANIZATION,
      payer_user_id: payerUserId,
      payer_org_id: invoice.issuer_org_id,
      amount: invoice.amount,
      currency: invoice.currency,
      status: PaymentStatus.PENDING,
      provider: PaymentProvider.STRIPE,
      provider_reference: paymentIntent.id,
      metadata: {
        stripe_payment_intent_id: paymentIntent.id,
      },
    });

    await this.paymentRepository.save(payment);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: invoice.amount,
      currency: invoice.currency,
    };
  }

  /**
   * Charge saved payment method (for recurring payments)
   * Use this when auto-charging for subscription renewals
   */
  async chargePaymentMethod(
    organizationId: string,
    userId: string,
    invoiceId: string,
    paymentMethodId?: string,
  ) {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, billed_user_id: userId },
      relations: ['billed_user'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const organization = await this.organizationUserRepository.findOne({
      where: { organization_id: organizationId, user_id: userId },
    });

    if (!organization?.stripe_customer_id) {
      throw new BadRequestException('Customer not found');
    }

    // Use provided payment method or default
    const pmId = paymentMethodId || organization.stripe_default_payment_method;

    if (!pmId) {
      throw new BadRequestException('No payment method available');
    }

    // Create and confirm payment intent in one go
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(invoice.amount * 100),
      currency: invoice.currency.toLowerCase(),
      customer: organization.stripe_customer_id,
      payment_method: pmId,
      off_session: true, // Customer not present
      confirm: true, // Immediately attempt to charge
      metadata: {
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
        organization_id: organizationId,
        auto_charge: 'true',
      },
      description:
        invoice.description ||
        `Auto-payment for invoice ${invoice.invoice_number}`,
    });

    // Create payment record
    const payment = this.paymentRepository.create({
      invoice_id: invoiceId,
      payer_type:
        invoice.billed_type === 'user'
          ? PaymentPayerType.USER
          : PaymentPayerType.ORGANIZATION,
      payer_user_id: invoice.billed_user_id,
      payer_org_id: organizationId,
      amount: invoice.amount,
      currency: invoice.currency,
      status:
        paymentIntent.status === 'succeeded'
          ? PaymentStatus.SUCCESS
          : PaymentStatus.PENDING,
      provider: PaymentProvider.STRIPE,
      provider_reference: paymentIntent.id,
      metadata: {
        stripe_payment_intent_id: paymentIntent.id,
        payment_method_id: pmId,
        auto_charge: true,
      },
    });

    await this.paymentRepository.save(payment);

    return {
      success: paymentIntent.status === 'succeeded',
      paymentIntent,
      payment,
    };
  }

  /**
   * Get payment intent details
   */
  async getPaymentIntent(paymentIntentId: string) {
    return await this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Cancel payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string) {
    return await this.stripe.paymentIntents.cancel(paymentIntentId);
  }

  // ==========================================
  // REFUNDS
  // ==========================================

  /**
   * Create refund for a payment
   */
  async createRefund(paymentId: string, amount?: number, reason?: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestException('Can only refund successful payments');
    }

    const refundAmount = amount
      ? Math.round(amount * 100)
      : Math.round(payment.amount * 100);

    const refund = await this.stripe.refunds.create({
      payment_intent: payment.provider_reference,
      amount: refundAmount,
      reason: reason as any,
      metadata: {
        payment_id: paymentId,
        refund_initiated_at: new Date().toISOString(),
      },
    });

    // Update payment metadata
    payment.metadata = {
      ...payment.metadata,
      refund: {
        id: refund.id,
        amount: refundAmount / 100,
        status: refund.status,
        created: new Date().toISOString(),
      },
    };

    if (refund.status === 'succeeded') {
      payment.status = PaymentStatus.REFUNDED;
    }

    await this.paymentRepository.save(payment);

    return refund;
  }

  /**
   * Get refund details
   */
  async getRefund(refundId: string) {
    return await this.stripe.refunds.retrieve(refundId);
  }

  // ==========================================
  // DISPUTES
  // ==========================================

  /**
   * Get all disputes for organization user
   */
  async getDisputes(organizationId: string, userId: string, limit = 10) {
    const organization = await this.organizationUserRepository.findOne({
      where: { organization_id: organizationId, user_id: userId },
    });

    if (!organization?.stripe_customer_id) {
      return [];
    }

    const charges = await this.stripe.charges.list({
      customer: organization.stripe_customer_id,
      limit: 100,
    });

    const disputes = charges.data
      .filter((charge) => charge.disputed)
      .map((charge) => charge.disputed);

    return disputes.slice(0, limit);
  }

  /**
   * Submit evidence for dispute
   */
  async submitDisputeEvidence(
    disputeId: string,
    evidence: Stripe.DisputeUpdateParams.Evidence,
  ) {
    return await this.stripe.disputes.update(disputeId, {
      evidence,
      submit: true,
    });
  }

  // ==========================================
  // PAYMENT HISTORY & CHARGES
  // ==========================================

  /**
   * Get payment history for organization user
   */
  async getPaymentHistory(organizationId: string, userId: string, limit = 20) {
    const organizationUser = await this.organizationUserRepository.findOne({
      where: { organization_id: organizationId, user_id: userId },
    });

    if (!organizationUser?.stripe_customer_id) {
      return [];
    }

    const charges = await this.stripe.charges.list({
      customer: organizationUser.stripe_customer_id,
      limit,
    });

    return charges.data.map((charge) => ({
      id: charge.id,
      amount: charge.amount / 100,
      currency: charge.currency,
      status: charge.status,
      paid: charge.paid,
      refunded: charge.refunded,
      description: charge.description,
      receipt_url: charge.receipt_url,
      created: new Date(charge.created * 1000),
      payment_method: {
        brand: charge.payment_method_details?.card?.brand,
        last4: charge.payment_method_details?.card?.last4,
      },
    }));
  }

  /**
   * Get balance (for marketplace/platform accounts)
   */
  async getBalance() {
    return await this.stripe.balance.retrieve();
  }

  // ==========================================
  // STRIPE INVOICES (For record keeping)
  // ==========================================

  /**
   * Create Stripe invoice item (for billing history)
   */
  async createInvoiceItem(
    organizationId: string,
    userId: string,
    amount: number,
    currency: string,
    description: string,
  ) {
    const customer = await this.getOrCreateCustomer(organizationId, userId);

    return await this.stripe.invoiceItems.create({
      customer: customer.id,
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      description,
    });
  }

  /**
   * Get Stripe invoices for customer
   */
  async getStripeInvoices(organizationId: string, userId: string, limit = 20) {
    const organizationUser = await this.organizationUserRepository.findOne({
      where: { organization_id: organizationId, user_id: userId },
    });

    if (!organizationUser?.stripe_customer_id) {
      return [];
    }

    const invoices = await this.stripe.invoices.list({
      customer: organizationUser.stripe_customer_id,
      limit,
    });

    return invoices.data;
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Format amount for Stripe (convert to cents)
   */
  formatAmount(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Format amount from Stripe (convert from cents)
   */
  parseAmount(amount: number): number {
    return amount / 100;
  }
}
