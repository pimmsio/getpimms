"use client";

import z from "@/lib/zod";
import { updatePasswordSchema } from "@/lib/zod/schemas/auth";
import { AppButton } from "@/ui/components/controls/app-button";
import { AppInput } from "@/ui/components/controls/app-input";
import { text } from "@/ui/design/tokens";
import { Label, Tooltip } from "@dub/ui";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

// Allow the user to update their existing password
export const UpdatePassword = () => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { isSubmitting, isDirty, errors },
    reset,
  } = useForm<z.infer<typeof updatePasswordSchema>>();

  const onSubmit = handleSubmit(async (data) => {
    try {
      const response = await fetch("/api/user/password", {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const { error } = await response.json();
        setError("currentPassword", { message: error.message });
        return;
      }

      reset();
      toast.success("Your password has been updated.");
    } catch (error) {
      toast.error(error.message);
    }
  });

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="border-b border-neutral-100 pb-3">
        <h2 className={text.sectionTitle}>Password</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your account password on {process.env.NEXT_PUBLIC_APP_NAME}.
        </p>
      </div>

      <div className="flex flex-wrap justify-between gap-4">
        <div className="grid w-full max-w-sm items-center gap-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <AppInput
            id="currentPassword"
            type="password"
            {...register("currentPassword", { required: true })}
          />
          <span className="block text-sm text-red-500" role="alert" aria-live="assertive">
            {errors.currentPassword?.message}
          </span>
        </div>

        <div className="grid w-full max-w-sm items-center gap-2">
          <Label htmlFor="newPassword">New Password</Label>
          <AppInput
            id="newPassword"
            type="password"
            {...register("newPassword", { required: true })}
          />
          <span className="block text-sm text-red-500" role="alert" aria-live="assertive">
            {errors.newPassword?.message}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
        <Tooltip content="Passwords must be at least 8 characters long containing at least one number, one uppercase, and one lowercase letter.">
          <p className="text-sm text-neutral-500 underline decoration-dotted underline-offset-2 hover:text-neutral-700">
            Password requirements
          </p>
        </Tooltip>
        <div className="shrink-0">
          <AppButton
            type="submit"
            loading={isSubmitting}
            disabled={!isDirty}
            variant="secondary"
          >
            Update Password
          </AppButton>
        </div>
      </div>
    </form>
  );
};
