import { cn } from "@dub/utils";
import { VariantProps, cva } from "class-variance-authority";
import { ReactNode, forwardRef } from "react";
import { LoadingSpinner } from "./icons";
import { Tooltip } from "./tooltip";

export const buttonVariants = cva("transition-all", {
  variants: {
    variant: {
      primary:
        "bg-brand-primary border-none text-white font-semibold text-md transition duration-500 hover:bg-brand-primary-hover",
      secondary: cn(
        "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50 focus-visible:border-neutral-500 outline-none",
        "data-[state=open]:border-neutral-500 data-[state=open]:ring-0",
      ),
      outline: "border-transparent text-neutral-600 hover:bg-neutral-100",
      success:
        "border-brand-primary bg-brand-primary text-white hover:bg-brand-primary-hover hover:ring-0",
      danger:
        "border-red-500 bg-red-500 text-white hover:bg-red-600 hover:ring-0",
      "danger-outline":
        "border-transparent bg-white text-red-500 hover:bg-red-600 hover:text-white",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  text?: ReactNode | string;
  textWrapperClassName?: string;
  shortcutClassName?: string;
  loading?: boolean;
  icon?: ReactNode;
  shortcut?: string;
  right?: ReactNode;
  disabledTooltip?: string | ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      text,
      variant = "primary",
      className,
      textWrapperClassName,
      shortcutClassName,
      loading,
      icon,
      shortcut,
      disabledTooltip,
      right,
      ...props
    }: ButtonProps,
    forwardedRef,
  ) => {
    if (disabledTooltip) {
      return (
        <Tooltip content={disabledTooltip}>
          <div
            className={cn(
              "flex h-10 w-full rounded cursor-not-allowed items-center justify-center gap-x-2 border border-neutral-200 bg-neutral-100 px-4 text-sm text-neutral-400 transition-all focus:outline-none",
              {
                "border-transparent bg-transparent":
                  variant?.endsWith("outline"),
              },
              className,
            )}
          >
            {icon}
            {text && (
              <div
                className={cn(
                  "min-w-0 truncate",
                  shortcut && "flex-1 text-left",
                  textWrapperClassName,
                )}
              >
                {text}
              </div>
            )}
            {shortcut && (
              <kbd
                className={cn(
                  "rounded hidden px-2 py-0.5 text-xs font-light transition-all duration-75 md:inline-block",
                  {
                    "bg-neutral-100": variant?.endsWith("outline"),
                  },
                  shortcutClassName,
                )}
              >
                {shortcut}
              </kbd>
            )}
          </div>
        </Tooltip>
      );
    }
    return (
      <button
        ref={forwardedRef}
        // if onClick is passed, it's a "button" type, otherwise it's being used in a form, hence "submit"
        type={props.onClick ? "button" : "submit"}
        className={cn(
          "group flex rounded-full h-10 w-full items-center justify-center gap-2 whitespace-nowrap border border-neutral-200 px-4 text-sm",
          props.disabled || loading
            ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400 outline-none"
            : buttonVariants({ variant }),
          className,
        )}
        disabled={props.disabled || loading}
        {...props}
      >
        {loading ? <LoadingSpinner /> : icon ? icon : null}
        {text && (
          <div
            className={cn(
              "min-w-0 truncate",
              shortcut && "flex-1 text-left",
              textWrapperClassName,
            )}
          >
            {text}
          </div>
        )}
        {shortcut && (
          <kbd
            className={cn(
              "rounded hidden px-2 py-0.5 text-xs font-light transition-all duration-75 md:inline-block",
              {
                "bg-brand-primary-light text-black":
                  variant === "primary",
                "bg-neutral-200 text-neutral-400 group-hover:bg-neutral-100 group-hover:text-neutral-500":
                  variant === "secondary",
                "bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200":
                  variant === "outline",
                "bg-red-100 text-red-600 group-hover:bg-red-500 group-hover:text-white":
                  variant === "danger-outline",
              },
              shortcutClassName,
            )}
          >
            {shortcut}
          </kbd>
        )}
        {right}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
