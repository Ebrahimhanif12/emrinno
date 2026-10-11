import {
  NextResponse,
} from "next/server";

import {
  serverEnv,
} from "@/lib/env/server";

import {
  processSSLCommerzSuccess,
} from "@/lib/payments/providers/sslcommerz/process-success";

import {
  readSSLCommerzCallback,
} from "@/lib/payments/providers/sslcommerz/read-callback";


export async function POST(
  request: Request
) {
  try {
    const callback =
      await readSSLCommerzCallback(
        request
      );


    if (
      !callback.validationId
    ) {
      throw new Error(
        "Missing validation ID."
      );
    }


    const result =
      await processSSLCommerzSuccess({
        validationId:
          callback.validationId,

        callbackTransactionId:
          callback.transactionId,
      });


    const url =
      new URL(
        "/",
        serverEnv.APP_BASE_URL
      );


    url.searchParams.set(
      "payment",
      result.state === "PAID"
        ? "success"
        : "review"
    );


    return NextResponse.redirect(
      url,
      303
    );
  } catch (error) {
    console.error(
      "SSLCOMMERZ success callback failed",
      {
        error:
          error instanceof Error
            ? error.message
            : "UNKNOWN",
      }
    );


    const url =
      new URL(
        "/",
        serverEnv.APP_BASE_URL
      );


    url.searchParams.set(
      "payment",
      "verification_failed"
    );


    return NextResponse.redirect(
      url,
      303
    );
  }
}