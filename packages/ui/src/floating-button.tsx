import { cn } from "@dub/utils";
import { ReactNode } from "react";
import { Plus } from "./icons";
import { Tooltip } from "./tooltip";

export interface FloatingActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: ReactNode | string;
  textWrapperClassName?: string;
  shortcutClassName?: string;
  loading?: boolean;
  icon?: ReactNode;
  shortcut?: string;
  right?: ReactNode;
  disabledTooltip?: string | ReactNode;
}

export function FloatingActionButton({
  text,
  className,
  textWrapperClassName,
  shortcutClassName,
  loading,
  icon,
  shortcut,
  disabledTooltip,
  right,
  ...props
}: FloatingActionButtonProps) {
  const current = (
    <button
      {...props}
      disabled={false}
      className={cn(
        "fixed bottom-6 right-4 rounded-full bg-[#3970ff] p-4 text-white shadow-lg transition hover:bg-[#3970ff]/90",
        className,
      )}
    >
      <Plus className="h-6 w-6" />
    </button>
  );

  if (disabledTooltip) {
    return (
      <Tooltip content={disabledTooltip}>
        {current}
      </Tooltip>
    );
  }

  return current;
}
