"use client";

import { requestPasswordResetAction } from "@/lib/actions/request-password-reset";
import { useMediaQuery } from "@dub/ui";
import { useAction } from "next-safe-action/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AppButton } from "@/ui/components/controls/app-button";
import { AppInput } from "@/ui/components/controls/app-input";

export const ForgotPasswordForm = () => {
  const router = useRouter();
  const { isMobile } = useMediaQuery();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");

  const { executeAsync, isPending } = useAction(requestPasswordResetAction, {
    onSuccess() {
      toast.success(
        "You will receive an email with instructions to reset your password.",
      );
      router.push("/login");
    },
    onError({ error }) {
      toast.error(error.serverError);
    },
  });

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          executeAsync({ email });
        }}
      >
        <div className="flex flex-col gap-8">
          <label>
            <span className="text-sm font-medium text-neutral-700">Email</span>
            <AppInput
              type="email"
              autoFocus={!isMobile}
              value={email}
              placeholder="cheers@pimms.io"
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </label>
          <AppButton
            type="submit"
            loading={isPending}
            disabled={email.length < 3}
          >
            Send reset link
          </AppButton>
        </div>
      </form>
    </div>
  );
};
