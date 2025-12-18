"use client";

import z from "@/lib/zod";
import { resetPasswordSchema } from "@/lib/zod/schemas/auth";
import { Label } from "@dub/ui";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AppButton } from "@/ui/components/controls/app-button";
import { AppInput } from "@/ui/components/controls/app-input";

export const ResetPasswordForm = () => {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof resetPasswordSchema>>();

  const onSubmit = handleSubmit(async (data) => {
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error.message);
      }

      toast.success(
        "Your password has been reset. You can now log in with your new password.",
      );
      router.replace("/login");
    } catch (error) {
      toast.error(error.message);
    }
  });

  return (
    <>
      <form className="flex flex-col gap-5" onSubmit={onSubmit}>
        <input type="hidden" value={token} {...register("token")} />

        <div className="grid w-full max-w-sm items-center gap-2">
          <Label htmlFor="password">Password</Label>
          <AppInput
            type="password"
            {...register("password")}
            required
            autoComplete="new-password"
          />
          {errors.password && (
            <span
              className="block text-sm text-red-500"
              role="alert"
              aria-live="assertive"
            >
              {errors.password.message}
            </span>
          )}
        </div>

        <div className="grid w-full max-w-sm items-center gap-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <AppInput
            type="password"
            {...register("confirmPassword")}
            required
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <span
              className="block text-sm text-red-500"
              role="alert"
              aria-live="assertive"
            >
              {errors.confirmPassword.message}
            </span>
          )}
        </div>

        <AppButton type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
          Reset Password
        </AppButton>
      </form>
    </>
  );
};
