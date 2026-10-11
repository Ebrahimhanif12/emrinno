import { io } from "next/cache";

import CheckWorkspace from "@/components/subminno/check/check-workspace";
import { getOwnedDocumentSummary } from "@/lib/services/subminno/documents/get-owned-document-summary";

type CheckPageProps = {
  params: Promise<{
    documentId: string;
  }>;
};

export default async function CheckPage({
  params,
}: CheckPageProps) {
  const { documentId } =
    await params;

  /*
   * This workspace depends on the authenticated
   * user's request/session and must not be
   * prerendered into the static shell.
   */
  await io();

  const {
    authenticated,
    document,
  } =
    await getOwnedDocumentSummary(
      documentId
    );

  return (
    <CheckWorkspace
      documentId={documentId}
      initialAuthenticated={
        authenticated
      }
      initialDocument={document}
    />
  );
}