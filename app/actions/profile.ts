"use server";

import { z } from "zod";

import {
  getVerifiedUser,
} from "@/lib/auth/get-verified-user";


const profileSchema = z.object({
  fullName:
    z.string()
      .trim()
      .min(2)
      .max(80),

  phone:
    z.string()
      .trim()
      .min(6)
      .max(20)
      .regex(
        /^[0-9+\-()\s]+$/,
        "Invalid phone number."
      ),

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
});


export type SaveCheckoutProfileResult =
  | {
      success: true;
    }
  | {
      success: false;

      code:
        | "AUTH_REQUIRED"
        | "INVALID_INPUT"
        | "SAVE_FAILED";

      message: string;
    };


export async function saveCheckoutProfileAction(
  input: unknown
): Promise<SaveCheckoutProfileResult> {
  const parsed =
    profileSchema.safeParse(
      input
    );


  if (!parsed.success) {
    return {
      success: false,
      code:
        "INVALID_INPUT",
      message:
        "Please check your billing information.",
    };
  }


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


  const {
    data,
    error,
  } = await auth.supabase
    .from("profiles")
    .update({
      full_name:
        parsed.data.fullName,

      phone:
        parsed.data.phone,

      address_line1:
        parsed.data.addressLine1,

      city:
        parsed.data.city,

      postcode:
        parsed.data.postcode,

      country:
        parsed.data.country,
    })
    .eq(
      "user_id",
      auth.id
    )
    .select("user_id")
    .maybeSingle();


  if (
    error ||
    !data
  ) {
    console.error(
      "Checkout profile save failed",
      {
        code:
          error?.code,

        userId:
          auth.id,
      }
    );


    return {
      success: false,
      code:
        "SAVE_FAILED",
      message:
        "Unable to save your billing information.",
    };
  }


  return {
    success: true,
  };
}