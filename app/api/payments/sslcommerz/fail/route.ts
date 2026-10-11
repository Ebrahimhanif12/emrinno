import {
  NextResponse,
} from "next/server";

import {
  serverEnv,
} from "@/lib/env/server";

import {
  readSSLCommerzCallback,
} from "@/lib/payments/providers/sslcommerz/read-callback";

import {
  recordTerminalCallback,
} from "@/lib/payments/record-terminal-callback";


export async function POST(
  request: Request
) {
  try {
    const callback =
      await readSSLCommerzCallback(
        request
      );


    await recordTerminalCallback({
      merchantTransactionId:
        callback.transactionId,

      providerStatus:
        "FAILED",
    });
  } catch (error) {
    console.error(
      "SSLCOMMERZ failure callback processing failed",
      {
        error:
          error instanceof Error
            ? error.message
            : "UNKNOWN",
      }
    );
  }


  const url =
    new URL(
      "/",
      serverEnv.APP_BASE_URL
    );


  url.searchParams.set(
    "payment",
    "failed"
  );


  return NextResponse.redirect(
    url,
    303
  );
}