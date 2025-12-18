import { cn } from "@dub/utils";
import { VariantProps, cva } from "class-variance-authority";
import { Calendar, ChevronDown } from "lucide-react";
import { ComponentProps, forwardRef } from "react";

const triggerStyles = cva(
  [
    "group peer flex h-10 cursor-pointer appearance-none items-center gap-x-2 truncate rounded-md border px-3 text-sm font-medium outline-none transition-colors",
    "bg-white border-neutral-200 text-neutral-700 placeholder-neutral-400",
    "disabled:pointer-events-none disabled:bg-neutral-100 disabled:text-neutral-400",
    "hover:border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100",
    "focus-visible:ring-2 focus-visible:ring-neutral-300",
    "data-[state=open]:ring-2 data-[state=open]:ring-neutral-300",
    //" aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-200 aria-[invalid=true]:border-red-500 invalid:ring-2 invalid:ring-red-200 invalid:border-red-500",
  ],
  {
    variants: {
      hasError: {
        true: "ring-2 ring-red-200 border-red-500",
      },
    },
  },
);

interface TriggerProps
  extends ComponentProps<"button">,
    VariantProps<typeof triggerStyles> {
  placeholder?: string;
}

const Trigger = forwardRef<HTMLButtonElement, TriggerProps>(
  (
    { className, children, placeholder, hasError, ...props }: TriggerProps,
    forwardedRef,
  ) => {
    return (
      <button
        ref={forwardedRef}
        className={cn(triggerStyles({ hasError }), className)}
        {...props}
      >
        <Calendar
          className={cn(
            "h-4 w-4 shrink-0 text-neutral-400",
            !!children && "text-neutral-900",
          )}
        />
        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left text-neutral-900">
          {children ? (
            children
          ) : placeholder ? (
            <span className="text-neutral-400">{placeholder}</span>
          ) : null}
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-neutral-400 transition-transform duration-75 group-data-[state=open]:rotate-180`}
        />
      </button>
    );
  },
);

Trigger.displayName = "DatePicker.Trigger";

export { Trigger };
