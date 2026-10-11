import type {
  Currency,
} from "@/lib/billing/types";


export type SSLCommerzMode =
  | "sandbox"
  | "production";


export type CreateSSLCommerzSessionInput = {
  paymentId: string;

  orderId: string;

  merchantTransactionId:
    string;

  amountBdt: number;

  currency: Currency;

  customer: {
    name: string;

    email: string;

    phone: string;

    addressLine1: string;

    city: string;

    postcode: string;

    country: string;
  };

  product: {
    name: string;

    category: string;
  };
};


export type CreatedSSLCommerzSession = {
  sessionId: string;

  gatewayUrl: string;
};


export type SSLCommerzSessionResponse = {
  status: string;

  failedreason?: string;

  sessionkey?: string;

  GatewayPageURL?: string;

  [key: string]: unknown;
};


export type SSLCommerzValidationResult = {
  status:
    | "VALID"
    | "VALIDATED";

  merchantTransactionId:
    string;

  validationId:
    string;

  amountBdt:
    number;

  currency:
    string;

  bankTransactionId:
    string | null;

  riskLevel:
    0 | 1;

  riskTitle:
    string | null;
};