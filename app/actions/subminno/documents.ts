"use server";

import { z } from "zod";

import { getVerifiedUser } from "@/lib/auth/get-verified-user";
import { getTextStats } from "@/lib/services/subminno/documents/text-stats";

const packageSchema =
  z.enum([
    "AI_CHECK",
    "COMPLETE_CHECK",
  ]);

const persistSchema = z
  .object({
    id: z.string().uuid(),

    source: z.enum([
      "FILE",
      "PASTE",
    ]),

    filename: z
      .string()
      .max(255)
      .nullable(),

    fileType: z
      .enum([
        "pdf",
        "docx",
        "txt",
        "text",
      ])
      .nullable(),

    text: z
      .string()
      .min(1)
      .max(200_000),

    selectedPackage:
      packageSchema,
  })
  .superRefine(
    (value, context) => {
      if (
        value.source === "FILE"
      ) {
        if (!value.filename) {
          context.addIssue({
            code: "custom",
            path: ["filename"],
            message:
              "A file name is required.",
          });
        }

        if (
          !value.fileType ||
          ![
            "pdf",
            "docx",
            "txt",
          ].includes(
            value.fileType
          )
        ) {
          context.addIssue({
            code: "custom",
            path: ["fileType"],
            message:
              "Invalid file type.",
          });
        }
      }

      if (
        value.source === "PASTE" &&
        value.fileType !== "text"
      ) {
        context.addIssue({
          code: "custom",
          path: ["fileType"],
          message:
            "Invalid pasted-text type.",
        });
      }
    }
  );

export type DocumentActionResult = {
  success: boolean;

  code?:
    | "AUTH_REQUIRED"
    | "INVALID_INPUT"
    | "SAVE_FAILED";

  message?: string;
};

function sanitizeFilename(
  filename: string | null
) {
  if (!filename) {
    return null;
  }

  return filename
    .replace(
      /[\0\r\n\\/]/g,
      ""
    )
    .trim()
    .slice(0, 255);
}

export async function persistGuestDocumentAction(
  input: unknown
): Promise<DocumentActionResult> {
  const parsed =
    persistSchema.safeParse(
      input
    );

  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message:
        "The document data is invalid.",
    };
  }

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

  const {
    cleanedText,
    wordCount,
    characterCount,
  } = getTextStats(
    parsed.data.text
  );

  if (
    wordCount < 20 ||
    wordCount > 30_000 ||
    characterCount >
      200_000
  ) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message:
        "The document exceeds the supported limits.",
    };
  }

  /*
   * Make retries idempotent.
   * RLS means this can only see
   * the current user's document.
   */
  const {
    data: existing,
    error: existingError,
  } = await auth.supabase
    .from("documents")
    .select("id")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (existingError) {
    console.error(
      "Document lookup failed",
      {
        code:
          existingError.code,
      }
    );

    return {
      success: false,
      code: "SAVE_FAILED",
      message:
        "Unable to save your document securely.",
    };
  }

  if (existing) {
    const { error } =
      await auth.supabase
        .from("documents")
        .update({
          selected_package:
            parsed.data
              .selectedPackage,
        })
        .eq(
          "id",
          parsed.data.id
        );

    if (error) {
      console.error(
        "Package update failed",
        {
          code: error.code,
        }
      );

      return {
        success: false,
        code: "SAVE_FAILED",
        message:
          "Unable to save your selection.",
      };
    }

    return {
      success: true,
    };
  }

  const { error } =
    await auth.supabase
      .from("documents")
      .insert({
        id: parsed.data.id,

        user_id: auth.id,

        source:
          parsed.data.source,

        filename:
          sanitizeFilename(
            parsed.data.filename
          ),

        file_type:
          parsed.data.fileType,

        original_text:
          cleanedText,

        working_text:
          cleanedText,

        selected_package:
          parsed.data
            .selectedPackage,
      });

  if (error) {
    console.error(
      "Document persistence failed",
      {
        code: error.code,
      }
    );

    return {
      success: false,
      code: "SAVE_FAILED",
      message:
        "Unable to save your document securely.",
    };
  }

  return {
    success: true,
  };
}

const packageUpdateSchema =
  z.object({
    documentId:
      z.string().uuid(),

    selectedPackage:
      packageSchema,
  });

export async function setDocumentPackageAction(
  input: unknown
): Promise<DocumentActionResult> {
  const parsed =
    packageUpdateSchema.safeParse(
      input
    );

  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message:
        "Invalid package selection.",
    };
  }

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

  const {
    data,
    error,
  } = await auth.supabase
    .from("documents")
    .update({
      selected_package:
        parsed.data
          .selectedPackage,
    })
    .eq(
      "id",
      parsed.data.documentId
    )
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      success: false,
      code: "SAVE_FAILED",
      message:
        "Unable to save your package selection.",
    };
  }

  return {
    success: true,
  };
}