export type Currency = "NGN" | "USD" | "GBP" | "EUR";
export type PaymentGateway = "paystack" | "kora" | "manual";
export type Theme = "light" | "dark";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
