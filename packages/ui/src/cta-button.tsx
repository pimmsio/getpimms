"use client";

import { forwardRef } from "react";
import { Button } from "./button";

export interface CtaButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
  variant?: "primary" | "secondary";
}

export const CtaButton = forwardRef<HTMLButtonElement, CtaButtonProps>(
  ({ 
    children, 
    loading = false, 
    disabled, 
    variant = "primary",
    ...props 
  }, ref) => {
    return (
      <Button
        ref={ref}
        {...props}
        disabled={disabled || loading}
        loading={loading}
        variant={variant}
        className="w-auto min-w-[130px]"
        text={children}
      />
    );
  }
);

CtaButton.displayName = "CtaButton";
