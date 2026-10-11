import "server-only";

import { z } from "zod";

import {
  sslCommerzConfig,
} from "@/lib/payments/providers/sslcommerz/config";

import type {
  CreatedSSLCommerzSession,
  CreateSSLCommerzSessionInput,
  SSLCommerzSessionResponse,
} from "@/lib/payments/providers/sslcommerz/types";


const inputSchema = z.object({
  paymentId:
    z.string().uuid(),

  orderId:
    z.string().uuid(),

  merchantTransactionId:
    z.string()
      .trim()
      .min(3)
      .max(30)
      .regex(
        /^[A-Z0-9_-]+$/
      ),

  amountBdt:
    z.number()
      .int()
      .min(10)
      .max(500_000),

  currency:
    z.literal("BDT"),

 customer:
  z.object({
    name:
      z.string()
        .trim()
        .min(1)
        .max(50),

    email:
      z.string()
        .trim()
        .email()
        .max(50),

    phone:
      z.string()
        .trim()
        .min(6)
        .max(20),

    addressLine1:
      z.string()
        .trim()
        .min(2)
        .max(50),

    city:
      z.string()
        .trim()
        .min(2)
        .max(50),

    postcode:
      z.string()
        .trim()
        .min(1)
        .max(30),

    country:
      z.string()
        .trim()
        .min(2)
        .max(50),
  }),

  product:
    z.object({
      name:
        z.string()
          .trim()
          .min(1)
          .max(255),

      category:
        z.string()
          .trim()
          .min(1)
          .max(100),
    }),
});


const responseSchema = z.object({
  status:
    z.string(),

  failedreason:
    z.string()
      .optional(),

  sessionkey:
    z.string()
      .min(1)
      .optional(),

  GatewayPageURL:
    z.string()
      .url()
      .optional(),
})
.passthrough();


export function validateSSLCommerzGatewayUrl(
  rawUrl: string
) {
  const url =
    new URL(rawUrl);


  if (
    url.protocol !==
      "https:" ||
    url.hostname !==
      sslCommerzConfig
        .expectedGatewayHostname
  ) {
    throw new Error(
      "Unexpected SSLCOMMERZ gateway URL."
    );
  }


  return url.toString();
}


export async function createSSLCommerzSession(
  rawInput:
    CreateSSLCommerzSessionInput
): Promise<CreatedSSLCommerzSession> {
  const parsed =
    inputSchema.safeParse(
      rawInput
    );


  if (!parsed.success) {
    throw new Error(
      "Invalid SSLCOMMERZ session request."
    );
  }


  const input =
    parsed.data;


  /*
   * SSLCOMMERZ V4 uses form-encoded parameters.
   */
  const body =
    new URLSearchParams();


  // ---------------------------------------------------------
  // Integration credentials
  // ---------------------------------------------------------

  body.set(
    "store_id",
    sslCommerzConfig.storeId
  );

  body.set(
    "store_passwd",
    sslCommerzConfig.storePassword
  );


  // ---------------------------------------------------------
  // Authoritative payment information
  // ---------------------------------------------------------

  body.set(
    "total_amount",
    input.amountBdt.toFixed(2)
  );

  body.set(
    "currency",
    input.currency
  );

  body.set(
    "tran_id",
    input.merchantTransactionId
  );


  // ---------------------------------------------------------
  // Callback / IPN endpoints
  // ---------------------------------------------------------

  body.set(
    "success_url",
    sslCommerzConfig.successUrl
  );

  body.set(
    "fail_url",
    sslCommerzConfig.failureUrl
  );

  body.set(
    "cancel_url",
    sslCommerzConfig.cancelUrl
  );

  body.set(
    "ipn_url",
    sslCommerzConfig.ipnUrl
  );


  // ---------------------------------------------------------
  // Customer information
  //
  // We deliberately do NOT manufacture address/phone data.
  // ---------------------------------------------------------

  body.set(
    "cus_name",
    input.customer.name
  );

  body.set(
    "cus_email",
    input.customer.email
  );

  body.set(
  "cus_add1",
  input.customer.addressLine1
);

body.set(
  "cus_city",
  input.customer.city
);

body.set(
  "cus_postcode",
  input.customer.postcode
);

body.set(
  "cus_country",
  input.customer.country
);

body.set(
  "cus_phone",
  input.customer.phone
);


  // ---------------------------------------------------------
  // Digital service information
  // ---------------------------------------------------------

  body.set(
    "shipping_method",
    "NO"
  );

  body.set(
    "product_name",
    input.product.name
  );

  body.set(
    "product_category",
    input.product.category
  );

  body.set(
    "product_profile",
    "non-physical-goods"
  );


  /*
   * No EMI for Emrinno's small pay-per-use purchases.
   */
  body.set(
    "emi_option",
    "0"
  );


  // ---------------------------------------------------------
  // Internal reconciliation metadata.
  //
  // Never treat returned value_a/value_b as payment proof.
  // They are reconciliation helpers only.
  // ---------------------------------------------------------

  body.set(
    "value_a",
    input.paymentId
  );

  body.set(
    "value_b",
    input.orderId
  );


  let response: Response;


  try {
    response =
      await fetch(
        sslCommerzConfig
          .initiateUrl,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },

          body:
            body.toString(),

          cache:
            "no-store",

          signal:
            AbortSignal.timeout(
              15_000
            ),
        }
      );
  } catch {
    throw new Error(
      "Unable to reach SSLCOMMERZ."
    );
  }


  if (!response.ok) {
    throw new Error(
      "SSLCOMMERZ session request failed."
    );
  }


  let rawResponse:
    unknown;


  try {
    rawResponse =
      await response.json();
  } catch {
    throw new Error(
      "Invalid response from SSLCOMMERZ."
    );
  }


  const validated =
    responseSchema.safeParse(
      rawResponse
    );


  if (!validated.success) {
    throw new Error(
      "Invalid response from SSLCOMMERZ."
    );
  }


  const providerResponse =
    validated.data as
      SSLCommerzSessionResponse;


  if (
    providerResponse.status !==
      "SUCCESS" ||
    !providerResponse.sessionkey ||
    !providerResponse.GatewayPageURL
  ) {
    /*
     * Do not expose SSLCOMMERZ's raw failure
     * response to the customer.
     */
    console.error(
      "SSLCOMMERZ session creation rejected",
      {
        status:
          providerResponse.status,

        failedReason:
          providerResponse
            .failedreason ??
          null,

        paymentId:
          input.paymentId,
      }
    );


    throw new Error(
      "Unable to start payment."
    );
  }


const gatewayUrl =
  validateSSLCommerzGatewayUrl(
    providerResponse
      .GatewayPageURL
  );

  return {
    sessionId:
      providerResponse
        .sessionkey,

    gatewayUrl,
  };
}