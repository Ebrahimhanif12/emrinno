import "server-only";

import { z } from "zod";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  getServiceWorkspacePath,
} from "@/lib/platform/service-workspace-path";


const transactionSchema =
  z.string()
    .trim()
    .min(3)
    .max(30);


export async function getPaymentReturnPath(
  merchantTransactionId: string
): Promise<string> {
  const parsed =
    transactionSchema.safeParse(
      merchantTransactionId
    );


  if (!parsed.success) {
    return "/";
  }


  const admin =
    createAdminClient();


  const {
    data: payment,
    error: paymentError,
  } = await admin
    .from("payments")
    .select("order_id")
    .eq(
      "merchant_transaction_id",
      parsed.data
    )
    .maybeSingle();


  if (
    paymentError ||
    !payment
  ) {
    console.error(
      "Payment return lookup failed",
      {
        code:
          paymentError?.code,
      }
    );

    return "/";
  }


  const {
    data: order,
    error: orderError,
  } = await admin
    .from("orders")
    .select(`
      service_code,
      service_reference_id
    `)
    .eq(
      "id",
      payment.order_id
    )
    .maybeSingle();


  if (
    orderError ||
    !order
  ) {
    console.error(
      "Payment order return lookup failed",
      {
        code:
          orderError?.code,

        orderId:
          payment.order_id,
      }
    );

    return "/";
  }


  return getServiceWorkspacePath(
    order.service_code,
    order.service_reference_id
  );
}