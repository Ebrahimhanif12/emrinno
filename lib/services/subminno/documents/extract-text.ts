import "pdf-parse/worker";

import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export async function extractTextFromFile(
  file: File
) {
  const arrayBuffer =
    await file.arrayBuffer();

  const buffer =
    Buffer.from(arrayBuffer);

  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase();

  if (extension === "txt") {
    return buffer.toString("utf-8");
  }

  if (extension === "docx") {
    const result =
      await mammoth.extractRawText({
        buffer,
      });

    return result.value;
  }

  if (extension === "pdf") {
    const parser = new PDFParse({
      data: new Uint8Array(buffer),
    });

    try {
      const result =
        await parser.getText();

      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  throw new Error(
    "Unsupported file type."
  );
}