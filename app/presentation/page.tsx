import type { Metadata } from "next";
import {
  ArrowLeft,
  FileText,
} from "lucide-react";
import Link from "next/link";

import PlatformHeader from "@/components/platform/platform-header";

export const metadata: Metadata = {
  title: "Presentation Maker",
  description:
    "Emrinno Presentation Maker will turn topics and source documents into structured, editable presentations.",
};

export default function PresentationPage() {
  return (
    <main className="min-h-screen bg-background">
      <PlatformHeader />

      <div className="platform-container py-14 sm:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-secondary transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All Emrinno services
        </Link>

        <section className="mt-8 max-w-2xl rounded-2xl border border-border bg-surface p-7 shadow-card sm:p-9">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-brand">
            <FileText className="size-6" />
          </div>

          <p className="mt-6 text-sm font-semibold text-brand">
            Work &amp; Documents
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Presentation Maker
          </h1>

          <p className="mt-4 text-base leading-7 text-secondary">
            Turn a topic, PDF, or document into a structured presentation with editable slides. This will be Emrinno&apos;s second service after Subminno.
          </p>

          <div className="mt-7 inline-flex rounded-full bg-surface-soft px-4 py-2 text-sm font-semibold text-secondary">
            Coming soon
          </div>
        </section>
      </div>
    </main>
  );
}
