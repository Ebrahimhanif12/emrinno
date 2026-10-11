"use client";

import {
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  startCheckoutAction,
} from "@/app/actions/payments";

import CheckoutProfileModal, {
  type CheckoutProfileDraft,
} from "@/components/account/checkout-profile-modal";


type SecureCheckoutControllerProps = {
  orderId:
    string | null;

  onClose:
    () => void;
};


export default function SecureCheckoutController({
  orderId,
  onClose,
}: SecureCheckoutControllerProps) {
  const startedOrderRef =
    useRef<string | null>(
      null
    );


  const [
    profile,
    setProfile,
  ] =
    useState<CheckoutProfileDraft | null>(
      null
    );


  const [
    profileOpen,
    setProfileOpen,
  ] =
    useState(false);


  const [
    preparing,
    setPreparing,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );


  const runCheckout =
    useCallback(
      async (
        targetOrderId: string
      ) => {
        setError(null);
        setPreparing(true);


        try {
          const result =
            await startCheckoutAction({
              orderId:
                targetOrderId,
            });


          if (result.success) {
            /*
             * Server has already restricted
             * this URL to the configured
             * SSLCOMMERZ gateway host.
             */
            window.location.assign(
              result.redirectUrl
            );

            return;
          }


          if (
            result.code ===
              "PROFILE_REQUIRED"
          ) {
            setProfile(
              result.profile ?? {
                fullName: "",
                phone: "",
                addressLine1: "",
                city: "",
                postcode: "",
                country:
                  "Bangladesh",
              }
            );

            setProfileOpen(true);
            return;
          }


          setError(
            result.message
          );
        } catch {
          setError(
            "Unable to start secure payment."
          );
        } finally {
          setPreparing(false);
        }
      },
      []
    );


  useEffect(() => {
    if (!orderId) {
      startedOrderRef.current =
        null;

      setError(null);
      setProfileOpen(false);
      setPreparing(false);

      return;
    }


    /*
     * Prevent React development-mode
     * effect replay from starting checkout
     * twice.
     *
     * The server/database also protects
     * against duplicate session creation.
     */
    if (
      startedOrderRef.current ===
        orderId
    ) {
      return;
    }


    startedOrderRef.current =
      orderId;


    void runCheckout(
      orderId
    );
  }, [
    orderId,
    runCheckout,
  ]);


  if (!orderId) {
    return null;
  }


  return (
    <>
      <CheckoutProfileModal
        open={profileOpen}
        initialProfile={
          profile
        }
        onClose={() => {
          setProfileOpen(false);
          onClose();
        }}
        onSaved={() => {
          setProfileOpen(false);

          void runCheckout(
            orderId
          );
        }}
      />


      {!profileOpen &&
        preparing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 text-center shadow-xl">
              <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-blue-50 text-brand">
                <ShieldCheck className="size-5" />
              </div>

              <h2 className="mt-4 text-base font-semibold">
                Preparing secure payment
              </h2>

              <p className="mt-2 text-sm leading-6 text-secondary">
                Connecting securely to SSLCOMMERZ.
              </p>

              <Loader2 className="mx-auto mt-5 size-5 animate-spin text-brand" />
            </div>
          </div>
        )}


      {!profileOpen &&
        !preparing &&
        error && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">
                    Payment could not start
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-secondary">
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close"
                  onClick={
                    onClose
                  }
                  className="rounded-lg p-2 text-secondary transition hover:bg-surface-soft hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>


              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    void runCheckout(
                      orderId
                    );
                  }}
                  className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
                >
                  Try again
                </button>

                <button
                  type="button"
                  onClick={
                    onClose
                  }
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-surface-soft"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}