import {
    NextResponse,
} from "next/server";

import {
    processSSLCommerzSuccess,
} from "@/lib/payments/providers/sslcommerz/process-success";

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


        if (
            (
                callback.status ===
                "VALID" ||
                callback.status ===
                "VALIDATED"
            ) &&
            callback.validationId
        ) {
            await processSSLCommerzSuccess({
                validationId:
                    callback.validationId,

                callbackTransactionId:
                    callback.transactionId,
            });


            return new NextResponse(
                "OK",
                {
                    status: 200,
                }
            );
        }


        if (
            callback.status ===
            "FAILED" ||
            callback.status ===
            "CANCELLED" ||
            callback.status ===
            "EXPIRED" ||
            callback.status ===
            "UNATTEMPTED"
        ) {
            await recordTerminalCallback({
                merchantTransactionId:
                    callback.transactionId,

                providerStatus:
                    callback.status,
            });


            return new NextResponse(
                "OK",
                {
                    status: 200,
                }
            );
        }


        return new NextResponse(
            "Unsupported notification",
            {
                status: 400,
            }
        );
    } catch (error) {
        console.error(
            "SSLCOMMERZ IPN processing failed",
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "UNKNOWN",
            }
        );


        return new NextResponse(
            "Payment notification processing failed",
            {
                status: 500,
            }
        );
    }
}