"use client";

import {
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type SubminnoHeaderProps = {
  compact?: boolean;
};

export default function SubminnoHeader({
  compact = false,
}: SubminnoHeaderProps) {
  const [open, setOpen] =
    useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="subminno-container flex h-16 items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/subminno"
            className="flex items-center"
          >
            <Image
              src="/brand/subminno-logo.png"
              alt="Subminno"
              width={210}
              height={54}
              priority
              className="h-10 w-auto sm:h-11"
            />
          </Link>

          <span className="hidden h-5 w-px bg-border sm:block" />

          <Link
            href="/"
            className="hidden text-xs font-semibold text-secondary transition hover:text-foreground sm:inline"
          >
            Emrinno
          </Link>
        </div>

        {!compact && (
          <>
            <nav className="hidden items-center gap-8 md:flex">
              <a
                href="#how-it-works"
                className="text-sm font-medium text-secondary transition hover:text-foreground"
              >
                How it works
              </a>

              <a
                href="#pricing"
                className="text-sm font-medium text-secondary transition hover:text-foreground"
              >
                Pricing
              </a>

              <a
                href="#faq"
                className="text-sm font-medium text-secondary transition hover:text-foreground"
              >
                FAQ
              </a>

              <a
                href="#check"
                className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                Check document
              </a>
            </nav>

            <button
              type="button"
              onClick={() =>
                setOpen(!open)
              }
              className="flex size-10 items-center justify-center rounded-md border border-border bg-surface text-foreground md:hidden"
              aria-label="Toggle navigation"
            >
              {open ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </>
        )}
      </div>

      {!compact && open && (
        <div className="border-t border-border bg-surface md:hidden">
          <div className="subminno-container flex flex-col py-3">
            <a
              href="#how-it-works"
              onClick={() =>
                setOpen(false)
              }
              className="rounded-md px-3 py-3 text-sm font-medium text-secondary hover:bg-surface-soft hover:text-foreground"
            >
              How it works
            </a>

            <a
              href="#pricing"
              onClick={() =>
                setOpen(false)
              }
              className="rounded-md px-3 py-3 text-sm font-medium text-secondary hover:bg-surface-soft hover:text-foreground"
            >
              Pricing
            </a>

            <a
              href="#faq"
              onClick={() =>
                setOpen(false)
              }
              className="rounded-md px-3 py-3 text-sm font-medium text-secondary hover:bg-surface-soft hover:text-foreground"
            >
              FAQ
            </a>

            <a
              href="#check"
              onClick={() =>
                setOpen(false)
              }
              className="mt-2 rounded-md bg-brand px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Check document
            </a>
          </div>
        </div>
      )}
    </header>
  );
}