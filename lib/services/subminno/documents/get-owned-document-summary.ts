import "server-only";

import { z } from "zod";

import { getVerifiedUser } from "@/lib/auth/get-verified-user";
import { calculatePrice } from "@/lib/services/subminno/pricing/calculate-price";
import type {
  DocumentPackage,
  DocumentSource,
  DocumentStatus,
  WorkspaceDocumentSummary,
} from "@/lib/services/subminno/types";

type Result = {
  authenticated: boolean;
  document: WorkspaceDocumentSummary | null;
};

export async function getOwnedDocumentSummary(
  documentId: string
): Promise<Result> {
  const idResult = z
    .string()
    .uuid()
    .safeParse(documentId);

  if (!idResult.success) {
    return {
      authenticated: false,
      document: null,
    };
  }

  const auth =
    await getVerifiedUser();

  if (!auth) {
    return {
      authenticated: false,
      document: null,
    };
  }

  const {
    data,
    error,
  } = await auth.supabase
    .from("documents")
    .select(
      `
        id,
        source,
        filename,
        file_type,
        word_count,
        character_count,
        selected_package,
        status,
        created_at
      `
    )
    .eq("id", idResult.data)
    .maybeSingle();

  if (error) {
    console.error(
      "Document summary lookup failed",
      {
        code: error.code,
      }
    );

    return {
      authenticated: true,
      document: null,
    };
  }

  if (!data) {
    return {
      authenticated: true,
      document: null,
    };
  }

  const document:
    WorkspaceDocumentSummary = {
      id: data.id,

      source:
        data.source as DocumentSource,

      filename:
        data.filename,

      fileType:
        data.file_type,

      wordCount:
        data.word_count,

      characterCount:
        data.character_count,

      pricing:
        calculatePrice(
          data.word_count
        ),

      selectedPackage:
        data.selected_package as
          | DocumentPackage
          | null,

      status:
        data.status as DocumentStatus,

      createdAt:
        data.created_at,
    };

  return {
    authenticated: true,
    document,
  };
}