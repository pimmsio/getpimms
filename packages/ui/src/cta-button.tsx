"use client";

import { cn } from "@dub/utils";
import { forwardRef } from "react";

export interface CtaButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
  variant?: "primary" | "secondary";
}

export const CtaButton = forwardRef<HTMLButtonElement, CtaButtonProps>(
  ({ 
    children, 
    className, 
    loading = false, 
    disabled, 
    variant = "primary",
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "font-bold relative overflow-hidden min-w-[130px] h-12 rounded-full text-white transition-all duration-200 disabled:opacity-50",
          variant === "primary" && [
            "bg-gradient-to-r from-[#2fcdfa] to-[#3970ff] hover:to-[#2850d0]",
            "shadow-sm hover:shadow-sm shadow-[#3970ff]/60 hover:shadow-[#2850d0]/90"
          ],
          variant === "secondary" && [
            "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50",
            "shadow-sm hover:shadow-md"
          ],
          className
        )}
        {...props}
      >
        {variant === "primary" && (
          <div className="pointer-events-none absolute inset-0 rounded-full overflow-hidden">
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-28 h-8 bg-white/20 blur-[6px] rotate-[-30deg] opacity-100 shadow-[0_1px_2px_rgba(0,0,0,0.25)] rounded-full" />
            <div className="absolute left-12 top-1/2 -translate-y-1/2 w-36 h-8 bg-white/20 blur-[10px] rotate-[-30deg] opacity-90 rounded-full" />
          </div>
        )}
        <span className="relative">
          {loading ? "Loading..." : children}
        </span>
      </button>
    );
  }
);

CtaButton.displayName = "CtaButton";
