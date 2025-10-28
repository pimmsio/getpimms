"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import useUtmTerms, {
  useUtmTermsCount,
} from "@/lib/swr/use-utm-terms";
import { UTM_PARAMETERS_MAX_PAGE_SIZE } from "@/lib/zod/schemas/utm-parameters";
import { Combobox } from "@dub/ui";
import { InputSearch } from "@dub/ui/icons";
import { cn, normalizeUtmValue } from "@dub/utils";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { useDebounce } from "use-debounce";

interface UtmTermSelectProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  disabledTooltip?: string;
  className?: string;
}

export function UtmTermSelect({
  value,
  onChange,
  disabled,
  disabledTooltip,
  className,
}: UtmTermSelectProps) {
  const { id: workspaceId } = useWorkspace();

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);

  const { data: utmTermsCount } = useUtmTermsCount();
  const useAsync = utmTermsCount && utmTermsCount > UTM_PARAMETERS_MAX_PAGE_SIZE;

  const { utmTerms, loading } = useUtmTerms({
    query: {
      sortBy: "name",
      sortOrder: "asc",
      ...(useAsync ? { search: debouncedSearch } : {}),
    },
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const createUtmTerm = async (name: string) => {
    const normalizedName = normalizeUtmValue(name);
    
    setIsCreating(true);
    const res = await fetch(`/api/utm-terms?workspaceId=${workspaceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: normalizedName }),
    });

    if (res.ok) {
      const newUtmTerm = await res.json();
      onChange(newUtmTerm.name);
      toast.success(`Successfully created UTM term!`);
      setIsOpen(false);
      // Mutate all utm-terms queries for this workspace
      await mutate(
        (key) =>
          typeof key === "string" &&
          key.startsWith(`/api/utm-terms`) &&
          key.includes(`workspaceId=${workspaceId}`),
      );
      setIsCreating(false);
      return true;
    } else {
      const { error } = await res.json();
      toast.error(error.message);
      setIsCreating(false);
    }

    return false;
  };

  const options = useMemo(
    () =>
      utmTerms?.map((term) => ({
        value: term.name,
        label: term.name,
      })),
    [utmTerms],
  );

  const selectedOption = value
    ? {
        value: value,
        label: value,
      }
    : null;

  return (
    <Combobox
      selected={selectedOption}
      setSelected={(option) => {
        onChange(option?.value || "");
      }}
      options={loading ? undefined : options}
      icon={<InputSearch className="size-4 text-neutral-500" />}
      searchPlaceholder="Search or add term..."
      emptyState={
        <p className="p-2 text-center text-sm text-neutral-500">
          No terms found
        </p>
      }
      buttonProps={{
        className: cn(
          "h-auto w-full rounded-md border px-3 py-2 text-sm text-neutral-700",
          !value && "text-neutral-400",
          isCreating && "opacity-50 cursor-wait",
          className,
        ),
        disabled: disabled || Boolean(disabledTooltip) || isCreating,
      }}
      onCreate={(search) => createUtmTerm(search)}
      open={isOpen}
      onOpenChange={setIsOpen}
      onSearchChange={setSearch}
      shouldFilter={!useAsync}
      caret={false}
      matchTriggerWidth
    >
      <span className="block truncate">
        {value || "Select term..."}
      </span>
    </Combobox>
  );
}

