import "server-only";

import { z } from "zod";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import type {
  PlatformOrder,
  PreparePlatformOrderInput,
  PreparedPlatformOrder,
} from "@/lib/billing/types";


const inputSchema = z.object({
  userId:
    z.string().uuid(),

  serviceCode:
    z.string()
      .trim()
      .min(2)
      .max(64)
      .regex(/^[A-Z0-9_]+$/),

  serviceReferenceId:
    z.string().uuid(),

  purchaseKey:
    z.string()
      .trim()
      .min(1)
      .max(64)
      .regex(/^[A-Z0-9_]+$/),

  offerCode:
    z.string()
      .trim()
      .min(1)
      .max(64)
      .regex(/^[A-Z0-9_]+$/),

  amountBdt:
    z.number()
      .int()
      .positive(),

  currency:
    z.literal("BDT"),

  pricingVersion:
    z.string()
      .trim()
      .min(1)
      .max(64),

  serviceSnapshot:
    z.record(
      z.string(),
      z.unknown()
    ),

  expiresAt:
    z.string()
      .datetime({
        offset: true,
      })
      .nullable()
      .optional(),
});


type RpcOrderRow = {
  reused: boolean;

  order_id: string;

  user_id: string;

  service_code:
    PlatformOrder["serviceCode"];

  service_reference_id: string;

  purchase_key: string;

  offer_code: string;

  amount_bdt: number;

  currency:
    PlatformOrder["currency"];

  pricing_version: string;

  service_snapshot:
    Record<string, unknown>;

  status:
    PlatformOrder["status"];

  created_at: string;

  updated_at: string;

  expires_at:
    string | null;

  paid_at:
    string | null;
};


function mapOrder(
  row: RpcOrderRow
): PlatformOrder {
  return {
    id:
      row.order_id,

    userId:
      row.user_id,

    serviceCode:
      row.service_code,

    serviceReferenceId:
      row.service_reference_id,

    purchaseKey:
      row.purchase_key,

    offerCode:
      row.offer_code,

    amountBdt:
      row.amount_bdt,

    currency:
      row.currency,

    pricingVersion:
      row.pricing_version,

    serviceSnapshot:
      row.service_snapshot ?? {},

    status:
      row.status,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    expiresAt:
      row.expires_at,

    paidAt:
      row.paid_at,
  };
}


export async function preparePlatformOrder(
  rawInput: PreparePlatformOrderInput
): Promise<PreparedPlatformOrder> {
  const parsed =
    inputSchema.safeParse(
      rawInput
    );

  if (!parsed.success) {
    throw new Error(
      "Invalid order input."
    );
  }

  const input =
    parsed.data;

  const admin =
    createAdminClient();

  const {
    data,
    error,
  } = await admin.rpc(
    "prepare_platform_order",
    {
      p_user_id:
        input.userId,

      p_service_code:
        input.serviceCode,

      p_service_reference_id:
        input.serviceReferenceId,

      p_purchase_key:
        input.purchaseKey,

      p_offer_code:
        input.offerCode,

      p_amount_bdt:
        input.amountBdt,

      p_currency:
        input.currency,

      p_pricing_version:
        input.pricingVersion,

      p_service_snapshot:
        input.serviceSnapshot,

      p_expires_at:
        input.expiresAt ??
        null,
    }
  );


  if (
    error ||
    !data ||
    data.length !== 1
  ) {
    console.error(
      "Platform order preparation failed",
      {
        code:
          error?.code,

        serviceCode:
          input.serviceCode,

        serviceReferenceId:
          input.serviceReferenceId,
      }
    );

    throw new Error(
      "Unable to prepare order."
    );
  }


  const row =
    data[0] as RpcOrderRow;


  return {
    order:
      mapOrder(row),

    reused:
      row.reused,
  };
}