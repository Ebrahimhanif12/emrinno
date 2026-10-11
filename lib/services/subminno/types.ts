export type DocumentSource =
  | "FILE"
  | "PASTE";

export type DocumentPackage =
  | "AI_CHECK"
  | "COMPLETE_CHECK";

export type DocumentStatus =
  | "UPLOADED"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "ANALYZING"
  | "READY"
  | "EDITING"
  | "RECHECKING"
  | "COMPLETED";

export type DocumentPricing = {
  aiCheck: number;
  completeCheck: number;
};

export type PreparedDocument = {
  id: string;

  source: DocumentSource;

  filename: string | null;
  fileType: string | null;

  text: string;

  wordCount: number;
  characterCount: number;

  pricing: DocumentPricing;

  createdAt: string;
};

export type WorkspaceDocumentSummary = {
  id: string;

  source: DocumentSource;

  filename: string | null;
  fileType: string | null;

  wordCount: number;
  characterCount: number;

  pricing: DocumentPricing;

  selectedPackage:
    | DocumentPackage
    | null;

  status: DocumentStatus;

  createdAt: string;
};