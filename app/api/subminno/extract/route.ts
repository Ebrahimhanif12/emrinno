import { NextResponse } from "next/server";

import { extractTextFromFile } from "@/lib/services/subminno/documents/extract-text";
import { getTextStats } from "@/lib/services/subminno/documents/text-stats";
import { validateUploadedFile } from "@/lib/services/subminno/documents/validate-uploaded-file";
import { calculatePrice } from "@/lib/services/subminno/pricing/calculate-price";

const MAX_FILE_SIZE =
  10 * 1024 * 1024;
const MAX_WORDS = 30_000;
const MAX_CHARACTERS = 200_000;

export async function POST(
  request: Request
) {
  try {
    const formData =
      await request.formData();
    const file =
      formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          message:
            "Please select a file.",
        },
        { status: 400 }
      );
    }

    if (
      file.size === 0 ||
      file.size > MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          message:
            "The file must be between 1 byte and 10 MB.",
        },
        { status: 400 }
      );
    }

    let extension:
      | "pdf"
      | "docx"
      | "txt";

    try {
      extension =
        await validateUploadedFile(
          file
        );
    } catch {
      return NextResponse.json(
        {
          message:
            "Only valid PDF, DOCX, and UTF-8 TXT files are supported.",
        },
        { status: 400 }
      );
    }

    const extractedText =
      await extractTextFromFile(
        file
      );

    const {
      cleanedText,
      wordCount,
      characterCount,
    } = getTextStats(
      extractedText
    );

    if (wordCount < 20) {
      return NextResponse.json(
        {
          message:
            "The document must contain at least 20 readable words.",
        },
        { status: 400 }
      );
    }

    if (
      wordCount > MAX_WORDS ||
      characterCount >
        MAX_CHARACTERS
    ) {
      return NextResponse.json(
        {
          message:
            "The document exceeds the supported length.",
        },
        { status: 400 }
      );
    }

    const pricing =
      calculatePrice(wordCount);

    return NextResponse.json({
      filename: file.name,
      fileType: extension,
      text: cleanedText,
      wordCount,
      characterCount,
      pricing,
    });
  } catch (error) {
    console.error(
      "Subminno document extraction failed",
      {
        errorType:
          error instanceof Error
            ? error.name
            : "UnknownError",
      }
    );

    return NextResponse.json(
      {
        message:
          "We could not read this document. Please try another file.",
      },
      { status: 500 }
    );
  }
}
