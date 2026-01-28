import { Payment as ApiPayment } from "../lib/api/paymentsApi";
import { PaymentStatus, Payment as UiPayment } from "../types/enterprise";
import { PaymentGateway } from "../types/common";

export const mapApiPaymentToUiPayment = (apiPayment: ApiPayment): UiPayment => {
  return {
    id: apiPayment.id,
    payer_user: {
      first_name: apiPayment.payer_user?.first_name || "Unknown",
      last_name: apiPayment.payer_user?.last_name || "Unknown",
      email: apiPayment.payer_user?.email || "",
    },
    amount: apiPayment.amount,
    currency: apiPayment.currency as "NGN" | "USD",
    provider: apiPayment.provider as PaymentGateway,
    status: apiPayment.status as PaymentStatus,
    created_at: apiPayment.created_at,
    description: apiPayment.description || "",
    provider_reference: apiPayment.provider_reference,
    plan_name:
      apiPayment.invoice?.member_subscription?.plan.name ||
      apiPayment.invoice?.organization_subscription?.plan.name ||
      "",
    is_auto_renewal:
      apiPayment.invoice?.member_subscription?.auto_renew ||
      apiPayment.invoice?.organization_subscription?.auto_renew ||
      false,
  };
};

export const mapApiPaymentsToUiPayments = (
  apiPayments: ApiPayment[],
): UiPayment[] => {
  return apiPayments.map(mapApiPaymentToUiPayment);
};
