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
});


export async function claimPaymentAttempt(
  input: {
    paymentId: string;
    userId: string;
  }
): Promise<boolean> {
  const parsed =
    inputSchema.safeParse(
      input
    );


  if (!parsed.success) {
    throw new Error(
      "Invalid payment attempt."
    );
  }


  const admin =
    createAdminClient();


  const {
    data,
    error,
  } = await admin.rpc(
    "claim_payment_attempt",
    {
      p_payment_id:
        parsed.data.paymentId,

      p_user_id:
        parsed.data.userId,
    }
  );


  if (error) {
    console.error(
      "Payment attempt claim failed",
      {
        code:
          error.code,

        paymentId:
          parsed.data.paymentId,
      }
    );

    throw new Error(
      "Unable to start payment."
    );
  }


  return data === true;
}