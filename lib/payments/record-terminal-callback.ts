import "server-only";

import {
  createAdminClient,
} from "@/lib/supabase/admin";


export type TerminalProviderStatus =
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "UNATTEMPTED";


export async function recordTerminalCallback(
  input: {
    merchantTransactionId:
      string;

    providerStatus:
      TerminalProviderStatus;
  }
) {
  const admin =
    createAdminClient();


  const {
    error,
  } = await admin.rpc(
    "record_sslcommerz_terminal_callback",
    {
      p_merchant_transaction_id:
        input
          .merchantTransactionId,

      p_provider_status:
        input.providerStatus,
    }
  );


  if (error) {
    console.error(
      "Terminal payment callback failed",
      {
        code:
          error.code,

        transactionId:
          input
            .merchantTransactionId,
      }
    );

    throw new Error(
      "Unable to update payment."
    );
  }
}