"use client";

import { LoadingSpinner, useRouterStuff } from "@dub/ui";
import { CircleXmark, Magnifier } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useDebouncedCallback } from "use-debounce";

type SearchBoxProps = {
  value: string;
  loading?: boolean;
  showClearButton?: boolean;
  onChange: (value: string) => void;
  onChangeDebounced?: (value: string) => void;
  debounceTimeoutMs?: number;
  inputClassName?: string;
  placeholder?: string;
};

export const SearchBox = forwardRef(
  (
    {
      value,
      loading,
      showClearButton = true,
      onChange,
      onChangeDebounced,
      debounceTimeoutMs = 500,
      inputClassName,
      placeholder,
    }: SearchBoxProps,
    forwardedRef,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(forwardedRef, () => inputRef.current);

    const debounced = useDebouncedCallback(
      (value) => onChangeDebounced?.(value),
      debounceTimeoutMs,
    );

    const onKeyDown = useCallback((e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // only focus on filter input when:
      // - user is not typing in an input or textarea
      // - there is no existing modal backdrop (i.e. no other modal is open)
      if (
        e.key === "/" &&
        target.tagName !== "INPUT" &&
        target.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape") {
        inputRef.current?.blur();
      }
    }, []);

    useEffect(() => {
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }, [onKeyDown]);

    return (
      <div className="relative group">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          {loading && value.length > 0 ? (
            <LoadingSpinner className="h-5 w-5" />
          ) : (
            <Magnifier className="h-5 w-5 text-neutral-400 transition-colors group-focus-within:text-neutral-600" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          className={cn(
            "peer w-full rounded-full border border-neutral-200 bg-white pl-11 pr-4 text-black outline-none placeholder:text-neutral-400 sm:text-sm",
            "transition-all duration-200",
            "focus:border-neutral-400 focus:ring-2 focus:ring-blue-500/10 focus:shadow-sm",
            "hover:border-neutral-300",
            inputClassName,
          )}
          placeholder={placeholder || "Search..."}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            debounced(e.target.value);
          }}
          autoCapitalize="none"
        />
        {showClearButton && value.length > 0 && (
          <button
            onClick={() => {
              onChange("");
              onChangeDebounced?.("");
            }}
            className="pointer-events-auto absolute inset-y-0 right-0 flex items-center pr-4 transition-opacity hover:opacity-70"
          >
            <CircleXmark className="h-4 w-4 text-neutral-500 hover:text-neutral-700" />
          </button>
        )}
        {!value && (
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden items-center pr-4 sm:flex">
            <kbd className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-xs text-neutral-400 font-sans">
              /
            </kbd>
          </div>
        )}
      </div>
    );
  },
);

export function SearchBoxPersisted({
  urlParam = "search",
  ...props
}: { urlParam?: string } & Partial<SearchBoxProps>) {
  const { queryParams, searchParams } = useRouterStuff();

  const [value, setValue] = useState(searchParams.get(urlParam) ?? "");
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Set URL param when debounced value changes
  useEffect(() => {
    if (searchParams.get(urlParam) ?? "" !== debouncedValue)
      queryParams(
        debouncedValue === ""
          ? { del: [urlParam, "page"] }
          : { set: { search: debouncedValue }, del: "page" },
      );
  }, [debouncedValue]);

  // Set value when URL param changes
  useEffect(() => {
    const search = searchParams.get(urlParam);
    // Only update if the value and debouncedValue are synced (the user isn't actively typing)
    if ((search ?? "" !== value) && value === debouncedValue)
      setValue(search ?? "");
  }, [searchParams.get(urlParam)]);

  return (
    <SearchBox
      value={value}
      onChange={setValue}
      onChangeDebounced={setDebouncedValue}
      {...props}
    />
  );
}
