"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import type { PreparedDocument } from "@/lib/services/subminno/types";

type GuestDraftContextValue = {
  draft: PreparedDocument | null;
  setDraft: (draft: PreparedDocument) => void;
  clearDraft: () => void;
};

const GuestDraftContext =
  createContext<GuestDraftContextValue | null>(null);

export function GuestDraftProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [draft, setDraftState] =
    useState<PreparedDocument | null>(null);

  function setDraft(
    document: PreparedDocument
  ) {
    setDraftState(document);
  }

  function clearDraft() {
    setDraftState(null);
  }

  return (
    <GuestDraftContext.Provider
      value={{
        draft,
        setDraft,
        clearDraft,
      }}
    >
      {children}
    </GuestDraftContext.Provider>
  );
}

export function useGuestDraft() {
  const context =
    useContext(GuestDraftContext);

  if (!context) {
    throw new Error(
      "useGuestDraft must be used inside GuestDraftProvider"
    );
  }

  return context;
}