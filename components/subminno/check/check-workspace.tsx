"use client";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  PenLine,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useState,
  useTransition,
} from "react";
import {
  useRouter,
} from "next/navigation";
import {
  persistGuestDocumentAction,
} from "@/app/actions/subminno/documents";
import AuthModal from "@/components/auth/auth-modal";
import SubminnoHeader from "@/components/subminno/layout/subminno-header";
import {
  useGuestDraft,
} from "@/components/subminno/providers/guest-draft-provider";
import {
  calculatePrice,
} from "@/lib/services/subminno/pricing/calculate-price";
import type {
  DocumentPackage,
  WorkspaceDocumentSummary,
} from "@/lib/services/subminno/types";
import { prepareSubminnoOrderAction } from "@/app/actions/subminno/order";
import SecureCheckoutController from "@/components/payments/secure-checkout-controller";
type CheckWorkspaceProps = {
  documentId: string;
  initialAuthenticated: boolean;
  initialDocument:
    WorkspaceDocumentSummary | null;
};
export default function CheckWorkspace({
  documentId,
  initialAuthenticated,
  initialDocument,
}: CheckWorkspaceProps) {
  const router =
    useRouter();
  const {
    draft,
    clearDraft,
  } =
    useGuestDraft();
  const [
    authOpen,
    setAuthOpen,
  ] =
    useState(false);
  const [
    selectedPackage,
    setSelectedPackage,
  ] =
    useState<DocumentPackage | null>(
      initialDocument
        ?.selectedPackage ??
        null
    );
  const [
    checkoutOrderId,
    setCheckoutOrderId,
  ] =
    useState<string | null>(
      null
    );
  const [
    message,
    setMessage,
  ] =
    useState<string | null>(
      null
    );
  const [
    waitingForRefresh,
    setWaitingForRefresh,
  ] =
    useState(false);
  const [
    isPending,
    startTransition,
  ] =
    useTransition();
  const guestDocument =
    draft?.id === documentId
      ? draft
      : null;
  const displayDocument:
    WorkspaceDocumentSummary | null =
      initialDocument ??
      (
        guestDocument
          ? {
              id:
                guestDocument.id,
              source:
                guestDocument.source,
              filename:
                guestDocument.filename,
              fileType:
                guestDocument.fileType,
              wordCount:
                guestDocument.wordCount,
              characterCount:
                guestDocument.characterCount,
              pricing:
                calculatePrice(
                  guestDocument.wordCount
                ),
              selectedPackage:
                null,
              status:
                "UPLOADED",
              createdAt:
                guestDocument.createdAt,
            }
          : null
      );
  // ---------------------------------------------------------
  // Keep local package state synchronized with the persisted
  // authoritative document after a server refresh.
  // ---------------------------------------------------------
  useEffect(() => {
    if (
      initialDocument
        ?.selectedPackage
    ) {
      setSelectedPackage(
        initialDocument
          .selectedPackage
      );
    }
  }, [
    initialDocument
      ?.selectedPackage,
  ]);
  // ---------------------------------------------------------
  // Guest document successfully persisted and server refresh
  // returned the authenticated document.
  //
  // Only now clear the RAM-only guest draft.
  // ---------------------------------------------------------
  useEffect(() => {
    if (
      waitingForRefresh &&
      initialDocument
    ) {
      clearDraft();
      setWaitingForRefresh(
        false
      );
    }
  }, [
    clearDraft,
    initialDocument,
    waitingForRefresh,
  ]);
  // ---------------------------------------------------------
  // Persist an in-memory guest draft after authentication,
  // then prepare its authoritative Emrinno order.
  // ---------------------------------------------------------
  async function persistGuestDraft() {
    if (
      !guestDocument ||
      !selectedPackage
    ) {
      return;
    }
    setMessage(null);
    // -------------------------------------------------------
    // 1. Persist the private document.
    // -------------------------------------------------------
    const result =
      await persistGuestDocumentAction({
        id:
          guestDocument.id,
        source:
          guestDocument.source,
        filename:
          guestDocument.filename,
        fileType:
          guestDocument.fileType,
        text:
          guestDocument.text,
        selectedPackage,
      });
    if (!result.success) {
      if (
        result.code ===
        "AUTH_REQUIRED"
      ) {
        setAuthOpen(true);
        return;
      }
      setMessage(
        result.message ??
          "Unable to save your document."
      );
      return;
    }
    // -------------------------------------------------------
    // 2. Prepare the platform order.
    //
    // Server independently verifies:
    // - authenticated user
    // - document ownership
    // - word count
    // - character count
    // - package
    // - pricing version
    // - amount
    // -------------------------------------------------------
    const orderResult =
      await prepareSubminnoOrderAction({
        documentId:
          guestDocument.id,
        selectedPackage,
      });
    if (!orderResult.success) {
      if (
        orderResult.code ===
        "AUTH_REQUIRED"
      ) {
        setAuthOpen(true);
        return;
      }
      setMessage(
        orderResult.message
      );
      return;
    }
    // -------------------------------------------------------
    // 3. Refresh the authenticated server workspace.
    //
    // Guest draft remains in RAM until persisted document
    // actually returns through initialDocument.
    // -------------------------------------------------------
    setAuthOpen(false);
    setWaitingForRefresh(
      true
    );
    setCheckoutOrderId(
      orderResult.orderId
    );
    router.refresh();
  }
  // ---------------------------------------------------------
  // Continue from package selection.
  // ---------------------------------------------------------
  function handleContinue() {
    if (
      !selectedPackage ||
      !displayDocument
    ) {
      return;
    }
    setMessage(null);
    // -------------------------------------------------------
    // Already-persisted authenticated document.
    // Prepare/reuse its Emrinno order.
    // -------------------------------------------------------
    if (initialDocument) {
      startTransition(
        async () => {
          const result =
            await prepareSubminnoOrderAction({
              documentId,
              selectedPackage,
            });
          if (!result.success) {
            if (
              result.code ===
              "AUTH_REQUIRED"
            ) {
              setAuthOpen(true);
              return;
            }
            setMessage(
              result.message
            );
            return;
          }
          setCheckoutOrderId(
            result.orderId
          );
          /*
           * Refresh so selected_package and any future
           * server-owned checkout state remain synchronized.
           */
          router.refresh();
        }
      );
      return;
    }
    // -------------------------------------------------------
    // Guest draft must authenticate before persistence/order.
    // -------------------------------------------------------
    if (!initialAuthenticated) {
      setAuthOpen(true);
      return;
    }
    startTransition(
      persistGuestDraft
    );
  }
  // ---------------------------------------------------------
  // No authenticated document and no matching in-memory
  // guest draft.
  // ---------------------------------------------------------
  if (!displayDocument) {
    return (
      <main className="min-h-screen bg-background">
        <SubminnoHeader compact />
        <div className="subminno-container flex min-h-[70vh] items-center justify-center py-12">
          <div className="max-w-md rounded-xl border border-border bg-surface p-8 text-center shadow-card">
            <FileText className="mx-auto size-9 text-muted" />
            <h1 className="mt-5 text-xl font-semibold">
              Document not available
            </h1>
            <p className="mt-2 text-sm leading-6 text-secondary">
              If you refreshed
              before signing in,
              your unsaved guest
              draft was intentionally
              cleared for privacy.
            </p>
            <Link
              href="/subminno"
              className="mt-6 inline-flex rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              Check another document
            </Link>
          </div>
        </div>
      </main>
    );
  }
  const continuePrice =
    selectedPackage ===
    "AI_CHECK"
      ? displayDocument
          .pricing.aiCheck
      : selectedPackage ===
          "COMPLETE_CHECK"
        ? displayDocument
            .pricing
            .completeCheck
        : null;
  return (
    <main className="min-h-screen bg-background">
      <SubminnoHeader compact />
      <div className="subminno-container py-8 sm:py-10">
        <Link
          href="/subminno"
          className="inline-flex items-center gap-2 text-sm font-medium text-secondary transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Upload a different document
        </Link>
        <section className="mt-6 rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand">
                <FileText className="size-6" />
              </div>
              <div className="min-w-0">
                <h1
                  title={
                    displayDocument.filename ??
                    "Pasted text"
                  }
                  className="max-w-full truncate text-base font-semibold text-foreground sm:text-lg"
                >
                  {displayDocument.filename ??
                    "Pasted text"}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-secondary">
                  <span>
                    {displayDocument.wordCount.toLocaleString()}{" "}
                    words
                  </span>
                  <span>•</span>
                  <span>
                    {displayDocument.characterCount.toLocaleString()}{" "}
                    characters
                  </span>
                  <span>•</span>
                  <span className="uppercase">
                    {displayDocument.source ===
                    "PASTE"
                      ? "Pasted text"
                      : displayDocument.fileType}
                  </span>
                </div>
              </div>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-success-soft px-3 py-1.5 text-xs font-semibold text-success">
              <CheckCircle2 className="size-4" />
              {initialDocument
                ? "Saved"
                : "Ready"}
            </div>
          </div>
        </section>
        <section className="mx-auto mt-10 max-w-4xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Choose how you want
              to check your document
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-secondary sm:text-base">
              Your price is based
              on this document&apos;s
              word count. No
              subscription required.
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <PackageCard
              title="AI Check"
              description="For a quick, professional AI-writing analysis."
              price={
                displayDocument
                  .pricing.aiCheck
              }
              selected={
                selectedPackage ===
                "AI_CHECK"
              }
              features={[
                "Full-document AI detection",
                "Overall AI-writing signal",
                "Flagged sections",
                "Detailed result",
              ]}
              onSelect={() =>
                setSelectedPackage(
                  "AI_CHECK"
                )
              }
            />
            <PackageCard
              title="Complete Check"
              description="Review, improve and recheck before submission."
              price={
                displayDocument
                  .pricing
                  .completeCheck
              }
              selected={
                selectedPackage ===
                "COMPLETE_CHECK"
              }
              recommended
              accent
              features={[
                "Everything in AI Check",
                "Writing improvement",
                "Up to 3 versions per section",
                "Accept, retry or keep original",
                "1 complete document recheck",
                "Final result",
              ]}
              onSelect={() =>
                setSelectedPackage(
                  "COMPLETE_CHECK"
                )
              }
            />
          </div>
          {selectedPackage && (
            <div className="mt-6">
              <button
                type="button"
                disabled={isPending}
                onClick={
                  handleContinue
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Continue securely
                {continuePrice !==
                  null && (
                  <>
                    {" "}
                    — ৳
                    {continuePrice}
                  </>
                )}
              </button>
            </div>
          )}
          {message && (
            <div className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm text-secondary">
              {message}
            </div>
          )}
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" />
            <p className="text-xs leading-5 text-secondary sm:text-sm">
              No AI detection is
              started until payment
              is verified.
            </p>
          </div>
        </section>
      </div>
      <SecureCheckoutController
        orderId={
          checkoutOrderId
        }
        onClose={() => {
          setCheckoutOrderId(
            null
          );
        }}
      />
      <AuthModal
        open={authOpen}
        onClose={() =>
          setAuthOpen(false)
        }
        onAuthenticated={
          persistGuestDraft
        }
      />
    </main>
  );
}
type PackageCardProps = {
  title: string;
  description: string;
  price: number;
  features: string[];
  selected: boolean;
  recommended?: boolean;
  accent?: boolean;
  onSelect: () => void;
};
function PackageCard({
  title,
  description,
  price,
  features,
  selected,
  recommended = false,
  accent = false,
  onSelect,
}: PackageCardProps) {
  return (
    <article
      className={`relative flex h-full flex-col rounded-xl border bg-surface p-6 transition ${
        selected
          ? accent
            ? "border-accent shadow-card-hover"
            : "border-brand shadow-card-hover"
          : recommended
            ? "border-teal-200 shadow-card"
            : "border-border shadow-card"
      }`}
    >
      {recommended && (
        <span className="absolute -top-3 right-5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
          Recommended
        </span>
      )}
      <h3 className="text-lg font-bold">
        {title}
      </h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-secondary">
        {description}
      </p>
      <div className="mt-6 flex items-end gap-1">
        <span className="text-sm font-semibold text-secondary">
          ৳
        </span>
        <span className="text-4xl font-bold tracking-tight">
          {price}
        </span>
      </div>
      <div className="my-6 h-px bg-border" />
      <ul className="flex-1 space-y-3">
        {features.map(
          (feature) => (
            <li
              key={feature}
              className="flex items-start gap-3 text-sm text-secondary"
            >
              <Check
                className={`mt-0.5 size-4 shrink-0 ${
                  accent
                    ? "text-accent"
                    : "text-success"
                }`}
              />
              <span>
                {feature}
              </span>
            </li>
          )
        )}
      </ul>
      <button
        type="button"
        onClick={onSelect}
        className={`mt-7 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
          selected
            ? "bg-foreground text-white"
            : accent
              ? "bg-accent text-white hover:bg-accent-hover"
              : "bg-brand text-white hover:bg-brand-hover"
        }`}
      >
        {selected ? (
          <>
            <Check className="size-4" />
            Selected
          </>
        ) : (
          <>
            {accent ? (
              <PenLine className="size-4" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            Choose {title}
          </>
        )}
      </button>
      {accent && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-secondary">
          <RefreshCw className="size-3.5" />
          Includes one full recheck
        </div>
      )}
    </article>
  );
}
