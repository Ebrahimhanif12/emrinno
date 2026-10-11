"use server";

import { z } from "zod";

import {
    getVerifiedUser,
} from "@/lib/auth/get-verified-user";

import {
    createPaymentAttempt,
} from "@/lib/payments/create-payment-attempt";

import {
    claimPaymentAttempt,
} from "@/lib/payments/claim-payment-attempt";

import {
    activatePaymentSession,
} from "@/lib/payments/activate-payment-session";

import {
    failPaymentAttempt,
} from "@/lib/payments/fail-payment-attempt";

import {
    createSSLCommerzSession,
    validateSSLCommerzGatewayUrl,
} from "@/lib/payments/providers/sslcommerz/create-session";

const inputSchema = z.object({
    orderId:
        z.string().uuid(),
});


export type StartCheckoutResult =
    | {
        success: true;

        redirectUrl: string;
    }
    | {
        success: false;

        code:
        | "AUTH_REQUIRED"
        | "INVALID_INPUT"
        | "ORDER_NOT_FOUND"
        | "PROFILE_REQUIRED"
        | "PAYMENT_IN_PROGRESS"
        | "PAYMENT_FAILED";

        message: string;

        profile?: {
            fullName: string;
            phone: string;
            addressLine1: string;
            city: string;
            postcode: string;
            country: string;
        };
    };


type CheckoutProfile = {
    full_name:
    string | null;

    phone:
    string | null;

    address_line1:
    string | null;

    city:
    string | null;

    postcode:
    string | null;

    country:
    string | null;
};


function profileComplete(
    profile:
        CheckoutProfile | null
): profile is {
    full_name: string;
    phone: string;
    address_line1: string;
    city: string;
    postcode: string;
    country: string;
} {
    return Boolean(
        profile?.full_name?.trim() &&
        profile?.phone?.trim() &&
        profile
            ?.address_line1
            ?.trim() &&
        profile?.city?.trim() &&
        profile?.postcode?.trim() &&
        profile?.country?.trim()
    );
}


function profileForClient(
    profile:
        CheckoutProfile | null
) {
    return {
        fullName:
            profile?.full_name ?? "",

        phone:
            profile?.phone ?? "",

        addressLine1:
            profile?.address_line1 ?? "",

        city:
            profile?.city ?? "",

        postcode:
            profile?.postcode ?? "",

        country:
            profile?.country ??
            "Bangladesh",
    };
}


function offerLabel(
    offerCode: string
) {
    return offerCode
        .split("_")
        .map(
            (part) =>
                part.charAt(0) +
                part
                    .slice(1)
                    .toLowerCase()
        )
        .join(" ");
}


export async function startCheckoutAction(
    input: unknown
): Promise<StartCheckoutResult> {
    const parsed =
        inputSchema.safeParse(
            input
        );


    if (!parsed.success) {
        return {
            success: false,
            code:
                "INVALID_INPUT",
            message:
                "Invalid checkout request.",
        };
    }


    // ---------------------------------------------------------
    // 1. Verify user.
    // ---------------------------------------------------------

    const auth =
        await getVerifiedUser();


    if (!auth) {
        return {
            success: false,
            code:
                "AUTH_REQUIRED",
            message:
                "Please sign in to continue.",
        };
    }


    // ---------------------------------------------------------
    // 2. Load the authenticated user's order.
    //
    // RLS prevents access to somebody else's order.
    // ---------------------------------------------------------

    const {
        data: order,
        error: orderError,
    } = await auth.supabase
        .from("orders")
        .select(`
      id,
      service_code,
      offer_code,
      amount_bdt,
      currency,
      status
    `)
        .eq(
            "id",
            parsed.data.orderId
        )
        .maybeSingle();


    if (orderError) {
        console.error(
            "Checkout order lookup failed",
            {
                code:
                    orderError.code,

                orderId:
                    parsed.data.orderId,
            }
        );


        return {
            success: false,
            code:
                "PAYMENT_FAILED",
            message:
                "Unable to start payment.",
        };
    }


    if (!order) {
        return {
            success: false,
            code:
                "ORDER_NOT_FOUND",
            message:
                "Order not available.",
        };
    }


    if (
        order.status !== "CREATED" &&
        order.status !==
        "PENDING_PAYMENT"
    ) {
        return {
            success: false,
            code:
                "PAYMENT_FAILED",
            message:
                "This order cannot be paid.",
        };
    }


    // ---------------------------------------------------------
    // 3. Load profile.
    // ---------------------------------------------------------

    const {
        data: profile,
        error: profileError,
    } = await auth.supabase
        .from("profiles")
        .select(`
      full_name,
      phone,
      address_line1,
      city,
      postcode,
      country
    `)
        .eq(
            "user_id",
            auth.id
        )
        .maybeSingle();


    if (profileError) {
        console.error(
            "Checkout profile lookup failed",
            {
                code:
                    profileError.code,

                userId:
                    auth.id,
            }
        );


        return {
            success: false,
            code:
                "PAYMENT_FAILED",
            message:
                "Unable to start payment.",
        };
    }


    if (!profileComplete(profile)) {
        return {
            success: false,
            code:
                "PROFILE_REQUIRED",
            message:
                "Complete your billing information to continue.",

            profile:
                profileForClient(
                    profile
                ),
        };
    }


    // ---------------------------------------------------------
    // 4. Obtain verified account email.
    // ---------------------------------------------------------

    const {
        data: authUserData,
        error: authUserError,
    } =
        await auth.supabase.auth.getUser();


    const email =
        authUserData
            .user
            ?.email;


    if (
        authUserError ||
        !email
    ) {
        console.error(
            "Checkout email lookup failed",
            {
                userId:
                    auth.id,
            }
        );


        return {
            success: false,
            code:
                "PAYMENT_FAILED",
            message:
                "Unable to start payment.",
        };
    }


    // ---------------------------------------------------------
    // 5. Create/reuse Emrinno payment attempt.
    // ---------------------------------------------------------

    let paymentAttempt:
        Awaited<
            ReturnType<
                typeof createPaymentAttempt
            >
        >;


    try {
        paymentAttempt =
            await createPaymentAttempt({
                orderId:
                    order.id,

                userId:
                    auth.id,
            });
    } catch {
        return {
            success: false,
            code:
                "PAYMENT_FAILED",
            message:
                "Unable to start payment.",
        };
    }


    const payment =
        paymentAttempt.payment;


    // ---------------------------------------------------------
    // 6. Existing SSLCOMMERZ checkout can be resumed.
    // ---------------------------------------------------------

    if (
        payment.status ===
        "REDIRECTED" &&
        payment.providerCheckoutUrl
    ) {
        try {
            return {
                success: true,

                redirectUrl:
                    validateSSLCommerzGatewayUrl(
                        payment
                            .providerCheckoutUrl
                    ),
            };
        } catch {
            return {
                success: false,

                code:
                    "PAYMENT_FAILED",

                message:
                    "Unable to resume payment.",
            };
        }
    }

    if (
        payment.status !==
        "CREATED"
    ) {
        return {
            success: false,
            code:
                "PAYMENT_FAILED",
            message:
                "Unable to start payment.",
        };
    }


    // ---------------------------------------------------------
    // 7. Atomically claim this attempt.
    // ---------------------------------------------------------

    let claimed:
        boolean;


    try {
        claimed =
            await claimPaymentAttempt({
                paymentId:
                    payment.id,

                userId:
                    auth.id,
            });
    } catch {
        return {
            success: false,
            code:
                "PAYMENT_FAILED",
            message:
                "Unable to start payment.",
        };
    }


    if (!claimed) {
        /*
         * Another concurrent request may have just created
         * the gateway session.
         *
         * Re-read through the normal payment-attempt function.
         */
        try {
            const latest =
                await createPaymentAttempt({
                    orderId:
                        order.id,

                    userId:
                        auth.id,
                });


            if (
                latest.payment.status ===
                "REDIRECTED" &&
                latest.payment
                    .providerCheckoutUrl
            ) {
                return {
                    success: true,

                    redirectUrl:
                        validateSSLCommerzGatewayUrl(
                            latest.payment
                                .providerCheckoutUrl
                        ),
                };
            }
        } catch {
            // Fall through to safe public response.
        }


        return {
            success: false,
            code:
                "PAYMENT_IN_PROGRESS",
            message:
                "Payment is being prepared. Please try again in a moment.",
        };
    }


    // ---------------------------------------------------------
    // 8. Create real SSLCOMMERZ hosted checkout session.
    // ---------------------------------------------------------

    let gatewaySession:
        Awaited<
            ReturnType<
                typeof createSSLCommerzSession
            >
        >;


    try {
        gatewaySession =
            await createSSLCommerzSession({
                paymentId:
                    payment.id,

                orderId:
                    order.id,

                merchantTransactionId:
                    payment
                        .merchantTransactionId,

                amountBdt:
                    payment.amountBdt,

                currency:
                    payment.currency,

                customer: {
                    name:
                        profile.full_name,

                    email,

                    phone:
                        profile.phone,

                    addressLine1:
                        profile.address_line1,

                    city:
                        profile.city,

                    postcode:
                        profile.postcode,

                    country:
                        profile.country,
                },
                product: {
                    name:
                        `${order.service_code
                        } - ${offerLabel(
                            order.offer_code
                        )
                        }`,

                    category:
                        "Digital AI Service",
                },
            });
    } catch (error) {
        /*
         * Session initiation definitely did not produce a
         * usable checkout URL for this request.
         */

        try {
            await failPaymentAttempt({
                paymentId:
                    payment.id,

                userId:
                    auth.id,
            });
        } catch {
            /*
             * Original provider error remains the user-facing
             * failure. Transition failure is already server-logged.
             */
        }


        console.error(
            "SSLCOMMERZ checkout initiation failed",
            {
                paymentId:
                    payment.id,

                error:
                    error instanceof Error
                        ? error.message
                        : "UNKNOWN",
            }
        );


        return {
            success: false,
            code:
                "PAYMENT_FAILED",
            message:
                "Unable to start payment.",
        };
    }


    // ---------------------------------------------------------
    // 9. Persist provider session + checkout URL atomically.
    //
    // IMPORTANT:
    // If this fails, DO NOT mark the attempt FAILED.
    //
    // SSLCOMMERZ has already created a real session and a
    // provider-side transaction may now exist.
    // ---------------------------------------------------------

    try {
        await activatePaymentSession({
            paymentId:
                payment.id,

            userId:
                auth.id,

            providerSessionId:
                gatewaySession
                    .sessionId,

            providerCheckoutUrl:
                gatewaySession
                    .gatewayUrl,
        });
    } catch (error) {
        console.error(
            "CRITICAL: SSLCOMMERZ session created but local activation failed",
            {
                paymentId:
                    payment.id,

                providerSessionId:
                    gatewaySession
                        .sessionId,

                error:
                    error instanceof Error
                        ? error.message
                        : "UNKNOWN",
            }
        );


        return {
            success: false,
            code:
                "PAYMENT_FAILED",
            message:
                "Unable to start payment. Please do not retry immediately.",
        };
    }


    return {
        success: true,

        redirectUrl:
            gatewaySession
                .gatewayUrl,
    };
}