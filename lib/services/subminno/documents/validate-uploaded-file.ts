const ALLOWED_MIME_TYPES: Record<
  "pdf" | "docx" | "txt",
  ReadonlySet<string>
> = {
  pdf: new Set([
    "application/pdf",
    "application/octet-stream",
    "",
  ]),
  docx: new Set([
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "application/octet-stream",
    "",
  ]),
  txt: new Set([
    "text/plain",
    "application/octet-stream",
    "",
  ]),
};

export type SupportedDocumentExtension =
  keyof typeof ALLOWED_MIME_TYPES;

function hasPrefix(
  bytes: Uint8Array,
  prefix: number[]
) {
  return prefix.every(
    (value, index) =>
      bytes[index] === value
  );
}

async function hasValidSignature(
  file: File,
  extension: SupportedDocumentExtension
) {
  const header = new Uint8Array(
    await file.slice(0, 64 * 1024).arrayBuffer()
  );

  if (extension === "pdf") {
    return hasPrefix(header, [
      0x25,
      0x50,
      0x44,
      0x46,
      0x2d,
    ]);
  }

  if (extension === "docx") {
    return (
      hasPrefix(header, [0x50, 0x4b, 0x03, 0x04]) ||
      hasPrefix(header, [0x50, 0x4b, 0x05, 0x06]) ||
      hasPrefix(header, [0x50, 0x4b, 0x07, 0x08])
    );
  }

  if (header.includes(0)) {
    return false;
  }

  try {
    new TextDecoder("utf-8", {
      fatal: true,
    }).decode(header);

    return true;
  } catch {
    return false;
  }
}

export async function validateUploadedFile(
  file: File
): Promise<SupportedDocumentExtension> {
  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase();

  if (
    extension !== "pdf" &&
    extension !== "docx" &&
    extension !== "txt"
  ) {
    throw new Error("UNSUPPORTED_FILE_TYPE");
  }

  const allowedMimeTypes =
    ALLOWED_MIME_TYPES[extension];

  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("INVALID_FILE_MIME");
  }

  if (
    !(await hasValidSignature(
      file,
      extension
    ))
  ) {
    throw new Error("INVALID_FILE_SIGNATURE");
  }

  return extension;
}
