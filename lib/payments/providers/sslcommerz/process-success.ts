import "server-only";

import {
  z,
} from "zod";

import {
  validateSSLCommerzPayment,
} from "@/lib/payments/providers/sslcommerz/validate-payment";

import {
  finalizeSSLCommerzPayment,
} from "@/lib/payments/finalize-sslcommerz-payment";


const schema = z.object({
  validationId:
    z.string()
      .trim()
      .min(1)
      .max(100),

  callbackTransactionId:
    z.string()
      .trim()
      .min(1)
      .max(50),
});


export async function processSSLCommerzSuccess(
  input: {
    validationId: string;

    callbackTransactionId:
      string;
  }
) {
  const parsed =
    schema.safeParse(input);


  if (!parsed.success) {
    throw new Error(
      "Invalid payment notification."
    );
  }


  const verified =
    await validateSSLCommerzPayment({
      validationId:
        parsed.data.validationId,
    });


  /*
   * Callback itself is untrusted.
   * Validation API result must agree with it.
   */
  if (
    verified
      .merchantTransactionId !==
    parsed.data
      .callbackTransactionId
  ) {
    throw new Error(
      "Payment transaction mismatch."
    );
  }


  const state =
    await finalizeSSLCommerzPayment(
      verified
    );


  return {
    state,

    merchantTransactionId:
      verified
        .merchantTransactionId,
  };
}