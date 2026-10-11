import "server-only";

import { z } from "zod";

import {
  sslCommerzConfig,
} from "@/lib/payments/providers/sslcommerz/config";

import type {
  SSLCommerzValidationResult,
} from "@/lib/payments/providers/sslcommerz/types";


const inputSchema = z.object({
  validationId:
    z.string()
      .trim()
      .min(1)
      .max(100),
});


const responseSchema =
  z.object({
    APIConnect:
      z.string(),

    status:
      z.string(),

    tran_id:
      z.string()
        .min(1)
        .max(50),

    val_id:
      z.string()
        .min(1)
        .max(100),

    amount:
      z.string()
        .regex(
          /^\d+(?:\.\d{1,2})?$/
        ),

    currency:
      z.string()
        .min(1)
        .max(10),

    currency_type:
      z.string()
        .max(10)
        .optional(),

    bank_tran_id:
      z.string()
        .max(100)
        .optional(),

    risk_level:
      z.union([
        z.string(),
        z.number(),
      ]),

    risk_title:
      z.string()
        .max(100)
        .optional(),
  })
  .passthrough();


export async function validateSSLCommerzPayment(
  input: {
    validationId: string;
  }
): Promise<SSLCommerzValidationResult> {
  const parsed =
    inputSchema.safeParse(
      input
    );


  if (!parsed.success) {
    throw new Error(
      "Invalid payment validation request."
    );
  }


  const url =
    new URL(
      sslCommerzConfig
        .validationUrl
    );


  url.searchParams.set(
    "val_id",
    parsed.data.validationId
  );

  url.searchParams.set(
    "store_id",
    sslCommerzConfig.storeId
  );

  url.searchParams.set(
    "store_passwd",
    sslCommerzConfig
      .storePassword
  );

  url.searchParams.set(
    "v",
    "1"
  );

  url.searchParams.set(
    "format",
    "json"
  );


  let response: Response;


  try {
    response =
      await fetch(
        url.toString(),
        {
          method:
            "GET",

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
      "Unable to reach SSLCOMMERZ validation service."
    );
  }


  if (!response.ok) {
    throw new Error(
      "SSLCOMMERZ validation request failed."
    );
  }


  let raw:
    unknown;


  try {
    raw =
      await response.json();
  } catch {
    throw new Error(
      "Invalid SSLCOMMERZ validation response."
    );
  }


  const validated =
    responseSchema.safeParse(
      raw
    );


  if (!validated.success) {
    throw new Error(
      "Invalid SSLCOMMERZ validation response."
    );
  }


  const data =
    validated.data;


  if (
    data.APIConnect !== "DONE"
  ) {
    throw new Error(
      "SSLCOMMERZ validation failed."
    );
  }


  if (
    data.status !== "VALID" &&
    data.status !== "VALIDATED"
  ) {
    throw new Error(
      "Payment was not validated."
    );
  }


  if (
    data.val_id !==
      parsed.data.validationId
  ) {
    throw new Error(
      "Payment validation ID mismatch."
    );
  }


  if (
    data.currency !== "BDT"
  ) {
    throw new Error(
      "Payment currency mismatch."
    );
  }


  if (
    data.currency_type &&
    data.currency_type !== "BDT"
  ) {
    throw new Error(
      "Payment source currency mismatch."
    );
  }


  const amount =
    Number(data.amount);


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "Invalid validated payment amount."
    );
  }


  const riskNumber =
    Number(data.risk_level);


  if (
    riskNumber !== 0 &&
    riskNumber !== 1
  ) {
    throw new Error(
      "Invalid payment risk level."
    );
  }


  return {
    status:
      data.status,

    merchantTransactionId:
      data.tran_id,

    validationId:
      data.val_id,

    amountBdt:
      amount,

    currency:
      data.currency,

    bankTransactionId:
      data.bank_tran_id?.trim()
        ? data.bank_tran_id
        : null,

    riskLevel:
      riskNumber as 0 | 1,

    riskTitle:
      data.risk_title?.trim()
        ? data.risk_title
        : null,
  };
}