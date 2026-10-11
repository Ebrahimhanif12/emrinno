import {
  BadgeDollarSign,
  Check,
  CircleAlert,
  CircleCheck,
  FileCheck2,
  LockKeyhole,
  RefreshCw,
  Upload,
} from "lucide-react";

import SubminnoHeader from "@/components/subminno/layout/subminno-header";
import DocumentInput from "@/components/subminno/upload/document-input";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <SubminnoHeader />

      {/* HERO */}
      <section
        id="check"
        className="overflow-hidden border-b border-border"
      >
        <div className="subminno-container grid min-h-[620px] items-center gap-8 py-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-6 lg:py-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
              Academic submission assistant
            </p>

            <h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-[-0.035em] text-foreground sm:text-5xl lg:text-[58px] lg:leading-[1.05]">
              Check your document
              <br className="hidden sm:block" />
              {" "}before submission.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-secondary">
              Professional AI detection without a monthly
              subscription. Upload your document, see the
              exact price, and pay only for what you check.
            </p>

            <div className="mt-8 max-w-xl">
              <DocumentInput />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-secondary">
              <span className="inline-flex items-center gap-2">
                <LockKeyhole className="size-3.5 text-accent" />
                Private processing
              </span>

              <span className="inline-flex items-center gap-2">
                <BadgeDollarSign className="size-3.5 text-brand" />
                Know the price before paying
              </span>
            </div>
          </div>

          <HeroVisual />
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-b border-border bg-surface">
        <div className="subminno-container grid gap-4 py-6 sm:grid-cols-3">
          <TrustItem
            icon={BadgeDollarSign}
            title="Pay only when needed"
            description="No monthly subscription or long-term plan."
          />

          <TrustItem
            icon={LockKeyhole}
            title="Private by design"
            description="Your document stays within your checking workflow."
          />

          <TrustItem
            icon={FileCheck2}
            title="Know before you pay"
            description="See document length and exact price first."
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="subminno-container py-16 sm:py-20"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-brand">
            Simple from start to finish
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How Subminno works
          </h2>

          <p className="mt-4 text-base leading-7 text-secondary">
            One document, one workspace, and a clear
            path from checking to submission.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <StepCard
            number="01"
            icon={Upload}
            title="Upload or paste"
            description="Add your document or paste the text you want to check."
          />

          <StepCard
            number="02"
            icon={BadgeDollarSign}
            title="See the exact price"
            description="We calculate the document length and show the cost before payment."
          />

          <StepCard
            number="03"
            icon={FileCheck2}
            title="Check, improve, recheck"
            description="Review AI-writing signals, improve flagged sections, and recheck."
          />
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section
        id="pricing"
        className="border-y border-border bg-surface"
      >
        <div className="subminno-container py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-accent">
              No subscription required
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
              Pricing that fits your document
            </h2>

            <p className="mt-4 leading-7 text-secondary">
              Upload first. We calculate the length and
              show the exact price before any paid
              detection begins.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background p-6">
              <p className="text-sm font-semibold text-brand">
                AI Check
              </p>

              <h3 className="mt-2 text-xl font-bold text-foreground">
                Detection only
              </h3>

              <p className="mt-3 text-sm leading-6 text-secondary">
                Full document analysis, overall writing
                signal, flagged sections, and detailed result.
              </p>
            </div>

            <div className="relative rounded-2xl border border-teal-200 bg-background p-6">
              <span className="absolute right-5 top-5 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                Recommended
              </span>

              <p className="text-sm font-semibold text-accent">
                Complete Check
              </p>

              <h3 className="mt-2 text-xl font-bold text-foreground">
                Check, improve, recheck
              </h3>

              <p className="mt-3 text-sm leading-6 text-secondary">
                Includes writing improvement, multiple
                versions, student review, and one full recheck.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="subminno-container py-16 sm:py-20"
      >
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Simple by design
            </h2>

            <p className="mt-4 leading-7 text-secondary">
              Subminno is designed for students who need
              a reliable check without another monthly subscription.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            <FaqItem
              question="Do I need a subscription?"
              answer="No. Pricing is calculated for each document based on its length."
            />

            <FaqItem
              question="When do I pay?"
              answer="Only after your document is processed and you can see the exact price."
            />

            <FaqItem
              question="Does an AI score prove that text was AI-generated?"
              answer="No. AI detection is probabilistic and should be treated as a writing signal, not definitive proof of authorship."
            />
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="subminno-container flex flex-col gap-3 py-8 text-sm text-secondary sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Subminno</span>
          <span>An Emrinno service</span>
        </div>
      </footer>
    </main>
  );
}

function HeroVisual() {
  return (
    <div className="relative hidden min-h-[520px] items-center justify-center lg:flex">
      <div className="absolute size-[430px] rounded-full bg-blue-50" />

      <div className="relative w-[330px] rounded-[28px] border border-border bg-surface p-7 shadow-card-hover">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-brand" />
          <div className="h-2 w-24 rounded-full bg-surface-soft" />
        </div>

        <div className="mt-8 space-y-3">
          <div className="h-3 w-4/5 rounded-full bg-surface-soft" />
          <div className="h-3 w-full rounded-full bg-surface-soft" />
          <div className="h-3 w-3/4 rounded-full bg-surface-soft" />

          <div className="h-3 w-[88%] rounded-full bg-red-100" />
          <div className="h-3 w-[64%] rounded-full bg-red-100" />

          <div className="h-3 w-full rounded-full bg-surface-soft" />
          <div className="h-3 w-[82%] rounded-full bg-amber-100" />
          <div className="h-3 w-11/12 rounded-full bg-surface-soft" />

          <div className="h-3 w-3/4 rounded-full bg-emerald-100" />
          <div className="h-3 w-full rounded-full bg-surface-soft" />
        </div>

        <div className="mt-9 border-t border-border pt-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-2.5 w-20 rounded-full bg-surface-soft" />
              <div className="mt-2 h-2.5 w-28 rounded-full bg-surface-soft" />
            </div>

            <FileCheck2 className="size-7 text-brand" />
          </div>
        </div>
      </div>

      <StatusChip
        className="absolute right-2 top-24"
        tone="danger"
        icon={CircleAlert}
      >
        AI signal detected
      </StatusChip>

      <StatusChip
        className="absolute -right-3 top-56"
        tone="warning"
        icon={RefreshCw}
      >
        Needs review
      </StatusChip>

      <StatusChip
        className="absolute right-10 bottom-24"
        tone="success"
        icon={CircleCheck}
      >
        Looks good
      </StatusChip>

      <div className="absolute bottom-28 left-7 flex items-center gap-2 text-accent">
        <div className="h-px w-14 bg-accent" />
        <span className="text-xs font-semibold">
          Review before submit
        </span>
      </div>
    </div>
  );
}

type StatusChipProps = {
  children: React.ReactNode;
  icon: React.ElementType;
  className?: string;
  tone: "danger" | "warning" | "success";
};

function StatusChip({
  children,
  icon: Icon,
  className = "",
  tone,
}: StatusChipProps) {
  const toneStyles = {
    danger:
      "border-red-100 bg-red-50 text-red-700",
    warning:
      "border-amber-100 bg-amber-50 text-amber-700",
    success:
      "border-emerald-100 bg-emerald-50 text-emerald-700",
  };

  return (
    <div
      className={`${className} flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-card ${toneStyles[tone]}`}
    >
      <Icon className="size-4" />
      {children}
    </div>
  );
}

function TrustItem({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 px-2 py-2">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand">
        <Icon className="size-5" />
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-secondary">
          {description}
        </p>
      </div>
    </div>
  );
}

function StepCard({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex size-11 items-center justify-center rounded-lg bg-blue-50 text-brand">
          <Icon className="size-5" />
        </div>

        <span className="text-sm font-semibold text-muted">
          {number}
        </span>
      </div>

      <h3 className="mt-6 text-lg font-bold text-foreground">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-secondary">
        {description}
      </p>
    </div>
  );
}

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-semibold text-foreground">
        {question}
      </h3>

      <p className="mt-2 text-sm leading-6 text-secondary">
        {answer}
      </p>
    </div>
  );
}