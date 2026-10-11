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


export async function failPaymentAttempt(
  input: {
    paymentId: string;
    userId: string;
  }
) {
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
    error,
  } = await admin.rpc(
    "fail_payment_attempt",
    {
      p_payment_id:
        parsed.data.paymentId,

      p_user_id:
        parsed.data.userId,
    }
  );


  if (error) {
    console.error(
      "Payment failure transition failed",
      {
        code:
          error.code,

        paymentId:
          parsed.data.paymentId,
      }
    );


    throw new Error(
      "Unable to update payment."
    );
  }
}