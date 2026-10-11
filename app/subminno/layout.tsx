import type { Metadata } from "next";
import type { ReactNode } from "react";

import { GuestDraftProvider } from "@/components/subminno/providers/guest-draft-provider";

export const metadata: Metadata = {
  title: "Subminno",
  description:
    "Check, improve, and review academic writing before submission. Pay only for what you check.",
};

export default function SubminnoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <GuestDraftProvider>
      {children}
    </GuestDraftProvider>
  );
}
