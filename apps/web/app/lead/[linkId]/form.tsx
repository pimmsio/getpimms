"use client";

import { AlertCircleFill } from "@/ui/shared/icons";
import { Button, useMediaQuery } from "@dub/ui";
import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { captureLeadMagnet } from "./action";

const initialState: { error: string | null; redirectUrl?: string } = {
  error: null,
};

export default function LeadMagnetForm({
  linkId,
  clickId,
}: {
  linkId: string;
  clickId: string;
}) {
  const { isMobile } = useMediaQuery();
  const [state, formAction] = useFormState(captureLeadMagnet, initialState);

  // Redirect on successful submission
  useEffect(() => {
    if (state.redirectUrl && !state.error) {
      window.location.href = state.redirectUrl;
    }
  }, [state.redirectUrl, state.error]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 bg-neutral-50 p-4 sm:p-8 sm:pt-6"
    >
      <input type="hidden" name="linkId" value={linkId} />
      <input type="hidden" name="clickId" value={clickId} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm text-neutral-800">
            First name <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1 rounded shadow-sm">
            <input
              type="text"
              name="firstName"
              id="firstName"
              autoFocus={!isMobile}
              required
              placeholder="John"
              className="block w-full rounded border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-0 sm:text-sm"
            />
          </div>
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm text-neutral-800">
            Last name
          </label>
          <div className="relative mt-1 rounded shadow-sm">
            <input
              type="text"
              name="lastName"
              id="lastName"
              placeholder="Doe"
              className="block w-full rounded border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-0 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm text-neutral-800">
          Email <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1 rounded shadow-sm">
          <input
            type="email"
            name="email"
            id="email"
            required
            placeholder="you@company.com"
            className={`${
              state.error
                ? "border-red-300 pr-10 text-red-500 placeholder-red-300 focus:border-red-500 focus:ring-0"
                : "border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:ring-0"
            } block w-full rounded focus:outline-none sm:text-sm`}
          />
          {state.error && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <AlertCircleFill
                className="h-5 w-5 text-red-500"
                aria-hidden="true"
              />
            </div>
          )}
        </div>
        {state.error && (
          <p className="mt-2 text-sm text-red-600" id="lead-magnet-error">
            {state.error}
          </p>
        )}
      </div>

      <FormButton />
    </form>
  );
}

function FormButton() {
  const { pending } = useFormStatus();
  return <Button text="Continue" loading={pending} />;
}


