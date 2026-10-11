"use server";

import { z } from "zod";

import { getVerifiedUser } from "@/lib/auth/get-verified-user";
import { preparePlatformOrder } from "@/lib/billing/prepare-platform-order";
import { SERVICE_CODES } from "@/lib/platform/services";
import {
  calculatePrice,
  PRICING_VERSION,
} from "@/lib/services/subminno/pricing/calculate-price";


const inputSchema = z.object({
  documentId:
    z.string().uuid(),

  selectedPackage:
    z.enum([
      "AI_CHECK",
      "COMPLETE_CHECK",
    ]),
});


export type PrepareSubminnoOrderResult =
  | {
      success: true;

      orderId: string;

      amountBdt: number;

      reused: boolean;
    }
  | {
      success: false;

      code:
        | "AUTH_REQUIRED"
        | "INVALID_INPUT"
        | "DOCUMENT_NOT_FOUND"
        | "DOCUMENT_NOT_ELIGIBLE"
        | "ORDER_FAILED";

      message: string;
    };


export async function prepareSubminnoOrderAction(
  input: unknown
): Promise<PrepareSubminnoOrderResult> {
  // ---------------------------------------------------------
  // 1. Validate browser-controlled input.
  //
  // Browser may choose:
  // - document
  // - package
  //
  // Browser never controls:
  // - user ID
  // - amount
  // - word count
  // - character count
  // - pricing version
  // - order state
  // - payment state
  // ---------------------------------------------------------

  const parsed =
    inputSchema.safeParse(
      input
    );

  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message:
        "Invalid checkout request.",
    };
  }


  // ---------------------------------------------------------
  // 2. Verify authenticated identity.
  // ---------------------------------------------------------

  const auth =
    await getVerifiedUser();

  if (!auth) {
    return {
      success: false,
      code: "AUTH_REQUIRED",
      message:
        "Please sign in to continue.",
    };
  }


  // ---------------------------------------------------------
  // 3. Load authoritative document metadata.
  //
  // Uses the authenticated user's Supabase session.
  // RLS ensures another user's document cannot be loaded.
  // ---------------------------------------------------------

  const {
    data: document,
    error: documentError,
  } = await auth.supabase
    .from("documents")
    .select(`
      id,
      word_count,
      character_count,
      status
    `)
    .eq(
      "id",
      parsed.data.documentId
    )
    .maybeSingle();


  if (documentError) {
    console.error(
      "Subminno checkout document lookup failed",
      {
        code:
          documentError.code,

        documentId:
          parsed.data.documentId,
      }
    );

    return {
      success: false,
      code: "ORDER_FAILED",
      message:
        "Unable to prepare checkout.",
    };
  }


  /*
   * Do not reveal whether the supplied UUID
   * belongs to another user.
   */
  if (!document) {
    return {
      success: false,
      code:
        "DOCUMENT_NOT_FOUND",
      message:
        "Document not available.",
    };
  }


  // ---------------------------------------------------------
  // 4. Check whether the document may purchase its
  //    primary Subminno service.
  // ---------------------------------------------------------

  if (
    document.status !==
      "UPLOADED" &&
    document.status !==
      "AWAITING_PAYMENT"
  ) {
    return {
      success: false,
      code:
        "DOCUMENT_NOT_ELIGIBLE",
      message:
        "This document is not eligible for a new primary check.",
    };
  }


  // ---------------------------------------------------------
  // 5. Revalidate authoritative limits.
  // ---------------------------------------------------------

  if (
    document.word_count < 20 ||
    document.word_count >
      30_000 ||
    document.character_count < 1 ||
    document.character_count >
      200_000
  ) {
    return {
      success: false,
      code:
        "DOCUMENT_NOT_ELIGIBLE",
      message:
        "This document is outside the supported limits.",
    };
  }


  // ---------------------------------------------------------
  // 6. Calculate current authoritative server-side price.
  //
  // No amount supplied by the browser is used.
  // ---------------------------------------------------------

  const pricing =
    calculatePrice(
      document.word_count
    );

  const amountBdt =
    parsed.data.selectedPackage ===
    "AI_CHECK"
      ? pricing.aiCheck
      : pricing.completeCheck;


  // ---------------------------------------------------------
  // 7. Prepare the permanent Emrinno platform order.
  //
  // Commercial order preparation happens BEFORE persisting
  // selected_package.
  //
  // This matters once SSLCOMMERZ payment is in progress:
  // a package cannot silently diverge from an existing
  // PENDING_PAYMENT order.
  // ---------------------------------------------------------

  try {
    const prepared =
      await preparePlatformOrder({
        userId:
          auth.id,

        serviceCode:
          SERVICE_CODES.SUBMINNO,

        serviceReferenceId:
          document.id,

        purchaseKey:
          "PRIMARY_CHECK",

        offerCode:
          parsed.data
            .selectedPackage,

        amountBdt,

        currency:
          "BDT",

        pricingVersion:
          PRICING_VERSION,

        serviceSnapshot: {
          word_count:
            document.word_count,

          character_count:
            document.character_count,
        },

        /*
         * The platform order itself does not expire yet.
         *
         * SSLCOMMERZ checkout/session expiry will be handled
         * by the payment layer when an actual payment attempt
         * starts.
         */
        expiresAt:
          null,
      });


    // -------------------------------------------------------
    // 8. Persist Subminno's selected package only after the
    //    commercial order was successfully prepared/reused.
    //
    // This is service state, not payment authority.
    // -------------------------------------------------------

    const {
      data: updatedDocument,
      error: packageError,
    } = await auth.supabase
      .from("documents")
      .update({
        selected_package:
          parsed.data
            .selectedPackage,
      })
      .eq(
        "id",
        document.id
      )
      .select("id")
      .maybeSingle();


    if (
      packageError ||
      !updatedDocument
    ) {
      console.error(
        "Subminno package persistence failed",
        {
          code:
            packageError?.code,

          documentId:
            document.id,

          orderId:
            prepared.order.id,
        }
      );

      return {
        success: false,
        code:
          "ORDER_FAILED",
        message:
          "Unable to prepare checkout.",
      };
    }


    // -------------------------------------------------------
    // 9. Return only safe checkout information.
    // -------------------------------------------------------

    return {
      success: true,

      orderId:
        prepared.order.id,

      amountBdt:
        prepared.order.amountBdt,

      reused:
        prepared.reused,
    };
  } catch (error) {
    /*
     * Detailed information stays server-side.
     * Never expose RPC/database/payment internals.
     */

    console.error(
      "Subminno order preparation failed",
      {
        documentId:
          document.id,

        error:
          error instanceof Error
            ? error.message
            : "UNKNOWN",
      }
    );

    return {
      success: false,
      code:
        "ORDER_FAILED",
      message:
        "Unable to prepare checkout.",
    };
  }
}