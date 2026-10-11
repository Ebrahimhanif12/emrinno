import "server-only";

import { z } from "zod";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  PAYMENT_PROVIDER,
} from "@/lib/payments/types";

import type {
  CreatedPaymentAttempt,
  PaymentAttempt,
} from "@/lib/payments/types";


const inputSchema = z.object({
  orderId:
    z.string().uuid(),

  userId:
    z.string().uuid(),
});


type RpcPaymentRow = {
  reused: boolean;

  payment_id: string;

  returned_order_id: string;

  returned_provider:
  PaymentAttempt["provider"];

  merchant_transaction_id: string;

  amount_bdt: number;

  currency:
  PaymentAttempt["currency"];

  status:
  PaymentAttempt["status"];

  provider_session_id:
  string | null;
provider_checkout_url:
  string | null;
  created_at: string;

  updated_at: string;
};


function mapPayment(
  row: RpcPaymentRow
): PaymentAttempt {
  return {
    id:
      row.payment_id,

    orderId:
      row.returned_order_id,

    provider:
      row.returned_provider,

    merchantTransactionId:
      row.merchant_transaction_id,

    amountBdt:
      row.amount_bdt,

    currency:
      row.currency,

    status:
      row.status,

    providerSessionId:
      row.provider_session_id,

   providerCheckoutUrl:
  row.provider_checkout_url,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}


export async function createPaymentAttempt(
  input: {
    orderId: string;
    userId: string;
  }
): Promise<CreatedPaymentAttempt> {
  const parsed =
    inputSchema.safeParse(
      input
    );

  if (!parsed.success) {
    throw new Error(
      "Invalid payment request."
    );
  }


  const admin =
    createAdminClient();


  const {
    data,
    error,
  } = await admin.rpc(
    "create_payment_attempt",
    {
      p_order_id:
        parsed.data.orderId,

      p_user_id:
        parsed.data.userId,

      /*
       * Hard-coded intentionally.
       *
       * Browser/server callers cannot choose
       * arbitrary payment providers.
       */
      p_provider:
        PAYMENT_PROVIDER,
    }
  );


  if (
    error ||
    !data ||
    data.length !== 1
  ) {
    console.error(
      "Payment attempt creation failed",
      {
        code:
          error?.code,

        orderId:
          parsed.data.orderId,
      }
    );

    throw new Error(
      "Unable to prepare payment."
    );
  }


  const row =
    data[0] as RpcPaymentRow;


  if (
    row.returned_provider !==
    PAYMENT_PROVIDER
  ) {
    console.error(
      "Unexpected payment provider returned",
      {
        paymentId:
          row.payment_id,

        provider:
          row.returned_provider,
      }
    );

    throw new Error(
      "Unable to prepare payment."
    );
  }


  return {
    payment:
      mapPayment(row),

    reused:
      row.reused,
  };
}