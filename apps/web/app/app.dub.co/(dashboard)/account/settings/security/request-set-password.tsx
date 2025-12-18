"use client";

import useUser from "@/lib/swr/use-user";
import { AppButton } from "@/ui/components/controls/app-button";
import { text } from "@/ui/design/tokens";
import { useState } from "react";
import { toast } from "sonner";

// Displayed when the user doesn't have a password set for their account
export const RequestSetPassword = () => {
  const { user } = useUser();
  const [sending, setSending] = useState(false);

  // Send an email to the user with instructions to set their password
  const sendPasswordSetRequest = async () => {
    try {
      setSending(true);

      const response = await fetch("/api/user/set-password", {
        method: "POST",
      });

      if (response.ok) {
        toast.success(
          `We've sent you an email to ${user?.email} with instructions to set your password`,
        );
        return;
      }

      const { error } = await response.json();
      throw new Error(error.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-neutral-100 pb-3">
        <h2 className={text.sectionTitle}>Password</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {user?.provider && (
            <>
              Your account is managed by{" "}
              <span className="uppercase">{user?.provider}</span>.{" "}
            </>
          )}
          You can set a password to use with your PIMMS account.
        </p>
      </div>
      <AppButton
        type="button"
        onClick={sendPasswordSetRequest}
        loading={sending}
        disabled={sending}
        className="w-fit"
      >
        Create account password
      </AppButton>
    </div>
  );
};
