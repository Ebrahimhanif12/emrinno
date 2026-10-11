import type {
  Currency,
  PaymentStatus,
} from "@/lib/billing/types";


/*
 * Emrinno's production payment provider.
 *
 * Keep this centralized instead of scattering
 * the literal "SSLCOMMERZ" throughout the codebase.
 */
export const PAYMENT_PROVIDER =
  "SSLCOMMERZ" as const;


export type PaymentProvider =
  typeof PAYMENT_PROVIDER;


/*
 * Platform representation of one payment attempt.
 *
 * This is intentionally independent from Subminno,
 * Presentation Maker, or any future Emrinno service.
 *
 * The order determines what the customer is buying.
 * The payment only represents an attempt to pay it.
 */
export type PaymentAttempt = {
  id: string;

  orderId: string;

  provider: PaymentProvider;

  merchantTransactionId: string;

  amountBdt: number;

  currency: Currency;

  status: PaymentStatus;

  providerSessionId:
    string | null;

  providerCheckoutUrl:
    string | null;

  createdAt: string;

  updatedAt: string;
};


export type CreatedPaymentAttempt = {
  payment: PaymentAttempt;

  reused: boolean;
};