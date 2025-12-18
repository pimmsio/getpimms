import { cn } from "@dub/utils";
import type { ComponentProps } from "react";
import { DayPicker, type DayPickerProps, type Matcher } from "react-day-picker";

type KeysToOmit = "showWeekNumber" | "captionLayout";

type CalendarProps = Omit<ComponentProps<typeof DayPicker>, KeysToOmit> & {
  // In newer `react-day-picker` versions this is part of the discriminated union props,
  // but in our current type surface it isn't included on the `DayPicker` component type.
  // We accept it here because consumers (e.g. range pickers) pass it through.
  selected?: unknown;
  onSelect?: unknown;
};

function Calendar({
  mode = "single",
  weekStartsOn = 1,
  numberOfMonths = 1,
  showYearNavigation = false,
  className,
  classNames,
  ...props
}: CalendarProps & { showYearNavigation?: boolean }) {
  // This is a custom prop used by some consumers of this Calendar wrapper.
  // It's intentionally not forwarded to `react-day-picker`.
  void showYearNavigation;

  // `react-day-picker` models its props as a discriminated union where some fields
  // become required depending on the mode/required flags. After we destructure and
  // rebuild props, TS can no longer prove those relationships, so we re-assert the
  // final shape as `DayPickerProps`.
  const dayPickerProps = {
    ...props,
    mode,
    weekStartsOn,
    numberOfMonths,
    showOutsideDays: numberOfMonths === 1,
    className,
    classNames: {
      months: "flex flex-row space-y-0",
      month: "space-y-4 p-3 w-full",
      caption: "relative flex items-center justify-center pt-1",
      caption_label: "text-sm font-semibold text-neutral-900",
      nav: "flex items-center gap-1",
      nav_button: cn(
        "inline-flex size-9 items-center justify-center rounded-md text-neutral-600",
        "hover:bg-neutral-100 active:bg-neutral-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300",
        "disabled:pointer-events-none disabled:opacity-50",
      ),
      nav_button_previous: "absolute left-1",
      nav_button_next: "absolute right-1",
      table: "w-full border-separate border-spacing-y-1",
      head_cell: "w-9 font-medium text-xs text-center text-neutral-400 pb-2",
      row: "w-full",
      cell: "relative p-0 text-center focus-within:relative text-neutral-900",
      day: cn(
        "relative size-10 rounded text-sm text-neutral-900",
        "hover:bg-neutral-100 active:bg-neutral-200 outline outline-offset-2 outline-0 focus-visible:outline-2 outline-blue-500",
      ),
      day_today: "font-semibold",
      day_selected:
        "rounded aria-selected:bg-brand-primary aria-selected:text-white",
      day_disabled:
        "!text-neutral-300 line-through disabled:hover:bg-transparent",
      day_outside: "text-neutral-400",
      day_range_middle:
        "!rounded-none aria-selected:!bg-brand-primary aria-selected:!text-white",
      day_range_start: "rounded-r-none !rounded-l",
      day_range_end: "rounded-l-none !rounded-r",
      day_hidden: "invisible",
      ...classNames,
    },
  } as DayPickerProps;

  return <DayPicker {...dayPickerProps} />;
}

export { Calendar, type Matcher };
