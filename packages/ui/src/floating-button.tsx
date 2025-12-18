import { cn } from "@dub/utils";
import { ReactNode } from "react";
import { Tooltip } from "./tooltip";
import { Button } from "./button";

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
    <Button
      {...props}
      disabled={false}
      loading={loading}
      variant="primary"
      // fixed positioning is FAB-specific; visuals come from Button
      className={cn("fixed bottom-6 right-4 h-12 w-12 px-0", className)}
      text={icon ?? text}
    />
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
