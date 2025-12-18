import { cn } from "@dub/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  // Minimal badges: rounded-md (not pill), consistent padding/typography.
  "max-w-fit rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-neutral-400 text-neutral-500",
        violet: "border-violet-600 bg-violet-600 text-white",
        blue: "border-brand-primary bg-brand-primary text-white",
        green: "border-green-100 bg-green-100 text-green-900",
        sky: "border-sky-900 bg-sky-900 text-white",
        black: "border-black bg-black text-white",
        gray: "border-neutral-200 bg-neutral-100 text-neutral-800",
        neutral: "border-neutral-400 text-neutral-500",
        amber: "border-amber-800 bg-amber-800 text-white",
        // Keep legacy variants but make them minimal (no gradients).
        blueGradient: "border-blue-200 bg-blue-50 text-blue-900",
        rainbow: "border-neutral-200 bg-neutral-900 text-white",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
