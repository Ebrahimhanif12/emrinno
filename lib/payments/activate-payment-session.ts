import "server-only";

import { z } from "zod";

import {
  createAdminClient,
} from "@/lib/supabase/admin";


const inputSchema = z.object({
  paymentId:
    z.string().uuid(),

  userId:
    z.string().uuid(),

  providerSessionId:
    z.string()
      .trim()
      .min(1)
      .max(255),

  providerCheckoutUrl:
    z.string()
      .url()
      .startsWith("https://")
      .max(500),
});


export async function activatePaymentSession(
  input: {
    paymentId: string;

    userId: string;

    providerSessionId: string;

    providerCheckoutUrl: string;
  }
) {
  const parsed =
    inputSchema.safeParse(
      input
    );


  if (!parsed.success) {
    throw new Error(
      "Invalid payment session."
    );
  }


  const admin =
    createAdminClient();


  const {
    error,
  } = await admin.rpc(
    "activate_payment_session",
    {
      p_payment_id:
        parsed.data.paymentId,

      p_user_id:
        parsed.data.userId,

      p_provider_session_id:
        parsed.data
          .providerSessionId,

      p_provider_checkout_url:
        parsed.data
          .providerCheckoutUrl,
    }
  );


  if (error) {
    console.error(
      "Payment session activation failed",
      {
        code:
          error.code,

        paymentId:
          parsed.data.paymentId,
      }
    );


    throw new Error(
      "Unable to activate payment."
    );
  }
}