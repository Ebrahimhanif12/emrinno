"use client";

import {
  Loader2,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
  useTransition,
} from "react";

import {
  saveCheckoutProfileAction,
} from "@/app/actions/profile";


export type CheckoutProfileDraft = {
  fullName: string;
  phone: string;
  addressLine1: string;
  city: string;
  postcode: string;
  country: string;
};


type CheckoutProfileModalProps = {
  open: boolean;

  initialProfile:
    CheckoutProfileDraft | null;

  onClose: () => void;

  onSaved: () => void;
};


export default function CheckoutProfileModal({
  open,
  initialProfile,
  onClose,
  onSaved,
}: CheckoutProfileModalProps) {
  const [
    profile,
    setProfile,
  ] =
    useState<CheckoutProfileDraft>({
      fullName: "",
      phone: "",
      addressLine1: "",
      city: "",
      postcode: "",
      country:
        "Bangladesh",
    });


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );


  const [
    isPending,
    startTransition,
  ] =
    useTransition();


  useEffect(() => {
    if (
      open &&
      initialProfile
    ) {
      setProfile({
        ...initialProfile,

        country:
          initialProfile.country ||
          "Bangladesh",
      });
    }
  }, [
    open,
    initialProfile,
  ]);


  if (!open) {
    return null;
  }


  function updateField(
    field:
      keyof CheckoutProfileDraft,
    value: string
  ) {
    setProfile(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );
  }


  function handleSubmit() {
    setError(null);


    startTransition(
      async () => {
        const result =
          await saveCheckoutProfileAction(
            profile
          );


        if (!result.success) {
          setError(
            result.message
          );

          return;
        }


        onSaved();
      }
    );
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              Billing information
            </h2>

            <p className="mt-1 text-sm leading-6 text-secondary">
              Enter the information required for secure payment processing.
            </p>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="rounded-lg p-2 text-secondary transition hover:bg-surface-soft hover:text-foreground disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>


        <div className="mt-6 space-y-4">
          <Field
            label="Full name"
            value={
              profile.fullName
            }
            autoComplete="name"
            onChange={(value) =>
              updateField(
                "fullName",
                value
              )
            }
          />

          <Field
            label="Phone"
            value={
              profile.phone
            }
            autoComplete="tel"
            onChange={(value) =>
              updateField(
                "phone",
                value
              )
            }
          />

          <Field
            label="Address"
            value={
              profile.addressLine1
            }
            autoComplete="street-address"
            onChange={(value) =>
              updateField(
                "addressLine1",
                value
              )
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="City"
              value={
                profile.city
              }
              autoComplete="address-level2"
              onChange={(value) =>
                updateField(
                  "city",
                  value
                )
              }
            />

            <Field
              label="Postcode"
              value={
                profile.postcode
              }
              autoComplete="postal-code"
              onChange={(value) =>
                updateField(
                  "postcode",
                  value
                )
              }
            />
          </div>

          <Field
            label="Country"
            value={
              profile.country
            }
            autoComplete="country-name"
            onChange={(value) =>
              updateField(
                "country",
                value
              )
            }
          />
        </div>


        {error && (
          <div className="mt-4 rounded-lg border border-danger/20 bg-red-50 p-3 text-sm text-danger">
            {error}
          </div>
        )}


        <button
          type="button"
          disabled={isPending}
          onClick={
            handleSubmit
          }
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending && (
            <Loader2 className="size-4 animate-spin" />
          )}

          Save and continue
        </button>


        <p className="mt-4 text-center text-xs leading-5 text-muted">
          This information is used for payment processing and your Emrinno account.
        </p>
      </div>
    </div>
  );
}


type FieldProps = {
  label: string;

  value: string;

  autoComplete: string;

  onChange: (
    value: string
  ) => void;
};


function Field({
  label,
  value,
  autoComplete,
  onChange,
}: FieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {label}
      </span>

      <input
        type="text"
        value={value}
        autoComplete={
          autoComplete
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
      />
    </label>
  );
}