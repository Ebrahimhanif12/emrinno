export const SERVICE_CODES = {
  SUBMINNO: "SUBMINNO",
  PRESENTATION: "PRESENTATION",
} as const;

export const SERVICE_CODE_VALUES = [
  SERVICE_CODES.SUBMINNO,
  SERVICE_CODES.PRESENTATION,
] as const;

export type ServiceCode =
  (typeof SERVICE_CODE_VALUES)[number];

export type ServiceStatus =
  | "ACTIVE"
  | "COMING_SOON";

export type PlatformService = {
  code: ServiceCode;
  name: string;
  path: string;
  status: ServiceStatus;
  category: "WORK_DOCUMENTS";
  description: string;
};

export const PLATFORM_SERVICES = [
  {
    code: SERVICE_CODES.SUBMINNO,
    name: "Subminno",
    path: "/subminno",
    status: "ACTIVE",
    category: "WORK_DOCUMENTS",
    description:
      "Check academic writing, review AI-writing signals, improve flagged sections, and recheck before submission.",
  },
  {
    code: SERVICE_CODES.PRESENTATION,
    name: "Presentation Maker",
    path: "/presentation",
    status: "COMING_SOON",
    category: "WORK_DOCUMENTS",
    description:
      "Turn a topic or source document into a structured, editable presentation.",
  },
] as const satisfies readonly PlatformService[];