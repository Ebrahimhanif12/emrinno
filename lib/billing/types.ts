import type {
  ServiceCode,
} from "@/lib/platform/services";

export type ServiceSnapshot =
  Record<string, unknown>;

export const ORDER_STATUSES = [
  "CREATED",
  "PENDING_PAYMENT",
  "PAID",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
] as const;

export type OrderStatus =
  (typeof ORDER_STATUSES)[number];


export const PAYMENT_STATUSES = [
  "CREATED",
  "REDIRECTED",
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
] as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUSES)[number];


export type Currency = "BDT";


/*
 * Generic platform-level order input.
 *
 * IMPORTANT:
 * These values must only come from trusted
 * server-side code.
 *
 * Never construct this object directly from
 * browser-supplied amount/user/pricing data.
 */
export type PreparePlatformOrderInput = {
  userId: string;

  serviceCode: ServiceCode;

  /*
   * ID of the service-specific resource.
   *
   * Examples:
   * SUBMINNO     -> document UUID
   * PRESENTATION -> presentation project UUID
   */
  serviceReferenceId: string;
  serviceSnapshot: ServiceSnapshot;

  /*
   * Identifies what kind of purchase this is
   * inside the service.
   *
   * Example:
   * PRIMARY_CHECK
   */
  purchaseKey: string;

  /*
   * Identifies the selected service offer.
   *
   * Examples:
   * AI_CHECK
   * COMPLETE_CHECK
   */
  offerCode: string;

  amountBdt: number;

  currency: Currency;

  pricingVersion: string;

  expiresAt?: string | null;
};


export type PlatformOrder = {
  id: string;

  userId: string;

  serviceCode: ServiceCode;

  serviceSnapshot: ServiceSnapshot;

  serviceReferenceId: string;

  purchaseKey: string;

  offerCode: string;

  amountBdt: number;

  currency: Currency;

  pricingVersion: string;

  status: OrderStatus;

  createdAt: string;

  updatedAt: string;

  paidAt: string | null;

  expiresAt: string | null;
};


export type PreparedPlatformOrder = {
  order: PlatformOrder;

  /*
   * true:
   * an existing compatible active order
   * was reused.
   *
   * false:
   * a new order was created.
   */
  reused: boolean;
};