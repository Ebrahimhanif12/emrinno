"use client";

import {
  Loader2,
  MailCheck,
  X,
} from "lucide-react";
import {
  useState,
  useTransition,
} from "react";

import { createClient } from "@/lib/supabase/client";

type AuthMode =
  | "signin"
  | "signup"
  | "verify";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => Promise<void>;
};

export default function AuthModal({
  open,
  onClose,
  onAuthenticated,
}: AuthModalProps) {
  const [mode, setMode] =
    useState<AuthMode>("signin");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [code, setCode] =
    useState("");

  const [message, setMessage] =
    useState<string | null>(null);

  const [isPending, startTransition] =
    useTransition();

  if (!open) {
    return null;
  }

  function normalizeEmail(
    value: string
  ) {
    return value
      .trim()
      .toLowerCase();
  }

  function validEmail(
    value: string
  ) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value
    );
  }

  function handleSignIn() {
    setMessage(null);

    const normalizedEmail =
      normalizeEmail(email);

    if (
      !validEmail(normalizedEmail) ||
      !password
    ) {
      setMessage(
        "Please enter a valid email and password."
      );

      return;
    }

    startTransition(async () => {
      const supabase =
        createClient();

      const {
        error,
      } =
        await supabase.auth.signInWithPassword(
          {
            email:
              normalizedEmail,

            password,
          }
        );

      if (error) {
        /*
         * Keep this generic.
         * Do not reveal whether
         * an account exists.
         */
        setMessage(
          "Invalid email or password."
        );

        return;
      }

      /*
       * Confirm that a valid
       * authenticated session
       * now exists.
       */
      const {
        data,
        error:
          claimsError,
      } =
        await supabase.auth.getClaims();

      if (
        claimsError ||
        !data?.claims?.sub
      ) {
        await supabase.auth.signOut();

        setMessage(
          "Unable to verify your session."
        );

        return;
      }

      await onAuthenticated();
    });
  }

  function handleSignUp() {
    setMessage(null);

    const normalizedEmail =
      normalizeEmail(email);

    if (
      !validEmail(normalizedEmail)
    ) {
      setMessage(
        "Please enter a valid email address."
      );

      return;
    }

    if (
      password.length < 10
    ) {
      setMessage(
        "Password must be at least 10 characters."
      );

      return;
    }

    if (
      password.length > 128
    ) {
      setMessage(
        "Password is too long."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setMessage(
        "Passwords do not match."
      );

      return;
    }

    startTransition(async () => {
      const supabase =
        createClient();

      const {
        error,
      } =
        await supabase.auth.signUp(
          {
            email:
              normalizedEmail,

            password,
          }
        );

      if (error) {
        /*
         * Do not expose whether
         * the address already
         * belongs to an account.
         */
        setMessage(
          "Unable to create the account. Please try again shortly."
        );

        return;
      }

      setEmail(
        normalizedEmail
      );

      setMode("verify");

      setMessage(
        "We sent a verification code to your email."
      );
    });
  }

  function handleVerify() {
    setMessage(null);

    const normalizedEmail =
      normalizeEmail(email);

    if (
      !/^\d{6,10}$/.test(
        code
      )
    ) {
      setMessage(
        "Enter the verification code from your email."
      );

      return;
    }

    startTransition(async () => {
      const supabase =
        createClient();

      const {
        error,
      } =
        await supabase.auth.verifyOtp(
          {
            email:
              normalizedEmail,

            token:
              code,

            type: "email",
          }
        );

      if (error) {
        setMessage(
          "The verification code is invalid or has expired."
        );

        return;
      }

      const {
        data,
        error:
          claimsError,
      } =
        await supabase.auth.getClaims();

      if (
        claimsError ||
        !data?.claims?.sub
      ) {
        setMessage(
          "Unable to verify your account."
        );

        return;
      }

      await onAuthenticated();
    });
  }

  function switchMode(
    newMode: AuthMode
  ) {
    setMode(newMode);
    setMessage(null);
    setPassword("");
    setConfirmPassword("");
    setCode("");
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-card-hover">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          aria-label="Close"
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-lg text-secondary transition hover:bg-surface-soft hover:text-foreground disabled:cursor-not-allowed"
        >
          <X className="size-5" />
        </button>

        {mode === "verify" ? (
          <>
            <div className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <MailCheck className="size-5" />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-foreground">
              Verify your email
            </h2>

            <p className="mt-2 text-sm leading-6 text-secondary">
              Enter the verification
              code sent to{" "}
              <strong className="text-foreground">
                {email}
              </strong>
              .
            </p>

            <label
              htmlFor="verification-code"
              className="mt-6 block text-sm font-semibold text-foreground"
            >
              Verification code
            </label>

            <input
              id="verification-code"
              value={code}
              onChange={(event) =>
                setCode(
                  event.target.value
                    .replace(
                      /\D/g,
                      ""
                    )
                    .slice(0, 10)
                )
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              disabled={isPending}
              className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-center text-lg tracking-[0.3em] text-foreground outline-none transition focus:border-brand disabled:opacity-60"
            />

            <button
              type="button"
              disabled={
                isPending ||
                code.length < 6
              }
              onClick={
                handleVerify
              }
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}

              Verify and continue
            </button>

            <button
              type="button"
              disabled={
                isPending
              }
              onClick={() =>
                switchMode(
                  "signup"
                )
              }
              className="mt-4 w-full text-center text-sm font-medium text-secondary transition hover:text-foreground"
            >
              Use a different
              email address
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-foreground">
              {mode ===
              "signin"
                ? "Continue with Emrinno"
                : "Create your account"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-secondary">
              {mode ===
              "signin"
                ? "Sign in to continue securely with this service."
                : "Create an Emrinno account to continue securely."}
            </p>

            <label
              htmlFor="auth-email"
              className="mt-6 block text-sm font-semibold text-foreground"
            >
              Email
            </label>

            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              autoComplete="email"
              disabled={isPending}
              maxLength={254}
              className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand disabled:opacity-60"
            />

            <label
              htmlFor="auth-password"
              className="mt-4 block text-sm font-semibold text-foreground"
            >
              Password
            </label>

            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              autoComplete={
                mode ===
                "signin"
                  ? "current-password"
                  : "new-password"
              }
              disabled={isPending}
              maxLength={128}
              className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand disabled:opacity-60"
            />

            {mode ===
              "signup" && (
              <>
                <label
                  htmlFor="confirm-password"
                  className="mt-4 block text-sm font-semibold text-foreground"
                >
                  Confirm
                  password
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  value={
                    confirmPassword
                  }
                  onChange={(
                    event
                  ) =>
                    setConfirmPassword(
                      event.target
                        .value
                    )
                  }
                  autoComplete="new-password"
                  disabled={
                    isPending
                  }
                  maxLength={128}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand disabled:opacity-60"
                />

                <p className="mt-2 text-xs text-secondary">
                  Use at least
                  10 characters.
                </p>
              </>
            )}

            <button
              type="button"
              disabled={
                isPending ||
                !email.trim() ||
                !password
              }
              onClick={
                mode ===
                "signin"
                  ? handleSignIn
                  : handleSignUp
              }
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}

              {mode ===
              "signin"
                ? "Sign in"
                : "Create account"}
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                switchMode(
                  mode ===
                    "signin"
                    ? "signup"
                    : "signin"
                )
              }
              className="mt-4 w-full text-center text-sm font-medium text-brand"
            >
              {mode ===
              "signin"
                ? "New to Emrinno? Create an account"
                : "Already have an account? Sign in"}
            </button>
          </>
        )}

        {message && (
          <div className="mt-4 rounded-lg bg-surface-soft p-3 text-sm leading-6 text-secondary">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}