import {
  ArrowRight,
  FileCheck2,
  FileText,
} from "lucide-react";
import Link from "next/link";

import PlatformHeader from "@/components/platform/platform-header";
import { PLATFORM_SERVICES } from "@/lib/platform/services";

const iconByCode = {
  SUBMINNO: FileCheck2,
  PRESENTATION: FileText,
} as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <PlatformHeader />

      <section className="border-b border-border bg-surface">
        <div className="platform-container py-16 sm:py-20 lg:py-24">
          <p className="text-sm font-semibold text-brand">
            Pay-per-use AI services
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
            Useful AI services,
            when you actually need them.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-secondary sm:text-lg">
            Emrinno turns specific tasks into finished outcomes with clear BDT pricing. No monthly subscription required.
          </p>
        </div>
      </section>

      <section className="platform-container py-14 sm:py-16">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-secondary">
              Work &amp; Documents
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Start with the service you need
            </h2>
          </div>

          <p className="max-w-md text-sm leading-6 text-secondary">
            One Emrinno account will work across every service as the platform grows.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {PLATFORM_SERVICES.map((service) => {
            const Icon = iconByCode[service.code];
            const active = service.status === "ACTIVE";

            return (
              <article
                key={service.code}
                className="rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-brand">
                    <Icon className="size-5" />
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      active
                        ? "bg-success-soft text-success"
                        : "bg-surface-soft text-secondary"
                    }`}
                  >
                    {active ? "Available" : "Coming soon"}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold text-foreground">
                  {service.name}
                </h3>

                <p className="mt-3 min-h-16 text-sm leading-6 text-secondary">
                  {service.description}
                </p>

                <Link
                  href={service.path}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-hover"
                >
                  {active ? "Open service" : "View service"}
                  <ArrowRight className="size-4" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="platform-container flex flex-col gap-2 py-8 text-sm text-secondary sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Emrinno</span>
          <span>A product of Frolinno</span>
        </div>
      </footer>
    </main>
  );
}
