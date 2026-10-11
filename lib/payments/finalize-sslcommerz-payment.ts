import "server-only";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import type {
  SSLCommerzValidationResult,
} from "@/lib/payments/providers/sslcommerz/types";


export type FinalizedPaymentState =
  | "PAID"
  | "REVIEW";


export async function finalizeSSLCommerzPayment(
  payment:
    SSLCommerzValidationResult
): Promise<FinalizedPaymentState> {
  const admin =
    createAdminClient();


  const {
    data,
    error,
  } = await admin.rpc(
    "finalize_sslcommerz_payment",
    {
      p_merchant_transaction_id:
        payment
          .merchantTransactionId,

      p_provider_validation_id:
        payment.validationId,

      p_provider_transaction_id:
        payment.bankTransactionId ?? "",

      p_provider_status:
        payment.status,

      p_amount_bdt:
        payment.amountBdt,

      p_currency:
        payment.currency,

      p_risk_level:
        payment.riskLevel,
    }
  );


  if (error) {
    console.error(
      "Verified payment finalization failed",
      {
        code:
          error.code,

        transactionId:
          payment
            .merchantTransactionId,
      }
    );

    throw new Error(
      "Unable to finalize payment."
    );
  }


  if (
    data !== "PAID" &&
    data !== "REVIEW"
  ) {
    throw new Error(
      "Unexpected payment finalization state."
    );
  }


  return data;
}