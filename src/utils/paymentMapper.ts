import { Payment as ApiPayment } from '../lib/api/paymentsApi';
import { Payment as UiPayment } from '../types/enterprise';
import { PaymentGateway } from '../types/common';

const mapPaymentStatus = (status: 'pending' | 'successful' | 'failed'): 'pending' | 'success' | 'failed' => {
  if (status === 'successful') return 'success';
  return status;
};

const mapPaymentGateway = (gateway: string): PaymentGateway | undefined => {
  // Map string gateway to PaymentGateway type
  // Return undefined for manual payments or unknown gateways
  if (!gateway) return undefined;
  return gateway as PaymentGateway;
};

export const mapApiPaymentToUiPayment = (apiPayment: ApiPayment): UiPayment => {
  return {
    id: apiPayment.id,
    enterpriseId: apiPayment.organization_id || '',
    memberId: apiPayment.member_id || '',
    memberName: apiPayment.member_name || 'Unknown',
    memberEmail: apiPayment.member_email || '',
    amount: apiPayment.amount,
    currency: apiPayment.currency as 'NGN' | 'USD',
    gateway: mapPaymentGateway(apiPayment.gateway),
    method: apiPayment.method as 'card' | 'bank_transfer' | 'ussd',
    status: mapPaymentStatus(apiPayment.status),
    createdAt: apiPayment.created_at,
    description: apiPayment.description || '',
    reference: apiPayment.reference || apiPayment.id,
    planId: '',
    planName: '',
    isAutoRenewal: false,
    paidAt: apiPayment.paid_at || apiPayment.created_at,
  };
};

export const mapApiPaymentsToUiPayments = (apiPayments: ApiPayment[]): UiPayment[] => {
  return apiPayments.map(mapApiPaymentToUiPayment);
};