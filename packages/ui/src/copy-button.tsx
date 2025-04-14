"use client";
import { cn } from "@dub/utils";
import { VariantProps, cva } from "class-variance-authority";
import { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useCopyToClipboard } from "./hooks";
import { Copy, Tick } from "./icons";

const copyButtonVariants = cva(
  "relative group rounded-full p-1.5 transition-all duration-75",
  {
    variants: {
      variant: {
        default: "bg-transparent hover:bg-neutral-100 active:bg-neutral-200",
        neutral: "bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function CopyButton({
  variant = "default",
  value,
  className,
  icon,
  successMessage,
  withText = true,
}: {
  value: string;
  className?: string;
  icon?: LucideIcon;
  successMessage?: string;
  withText?: boolean;
} & VariantProps<typeof copyButtonVariants>) {
  const [copied, copyToClipboard] = useCopyToClipboard();
  const Comp = icon || Copy;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toast.promise(copyToClipboard(value), {
          success: successMessage || "Copied to clipboard!",
        });
      }}
      className={cn(
        copyButtonVariants({ variant }),
        withText && "flex items-center gap-1",
        className,
      )}
      type="button"
    >
      <span className="sr-only">Copy</span>
      {withText && <span className="hidden text-xs sm:block">Copy</span>}
      {copied ? (
        <Tick className="h-3.5 w-3.5" />
      ) : (
        <Comp className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
