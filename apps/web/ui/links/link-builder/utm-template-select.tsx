import useWorkspace from "@/lib/swr/use-workspace";
import { UtmTemplateWithUserProps } from "@/lib/types";
import { useAddEditUtmTemplateModal } from "@/ui/modals/add-edit-utm-template.modal";
import UtmTemplateBadge from "@/ui/links/utm-template-badge";
import { Combobox } from "@dub/ui";
import { DiamondTurnRight } from "@dub/ui/icons";
import { fetcher } from "@dub/utils";
import { useMemo, useState } from "react";
import useSWR from "swr";

export function UtmTemplateSelect({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (templateId: string | null) => void;
  disabled?: boolean;
}) {
  const { id: workspaceId } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);

  const { data: templates, isLoading } = useSWR<UtmTemplateWithUserProps[]>(
    workspaceId ? `/api/utm?workspaceId=${workspaceId}` : null,
    fetcher,
    {
      dedupingInterval: 60000,
    },
  );

  const { AddEditUtmTemplateModal, setShowAddEditUtmTemplateModal } =
    useAddEditUtmTemplateModal();

  const options = useMemo(
    () =>
      templates?.map((template) => ({
        value: template.id,
        label: template.name,
        data: template,
      })) || [],
    [templates],
  );

  const selectedOption = useMemo(() => {
    if (!value) return null;
    const template = templates?.find((t) => t.id === value);
    return template
      ? { value: template.id, label: template.name, data: template }
      : null;
  }, [value, templates]);

  return (
    <>
      {workspaceId && <AddEditUtmTemplateModal />}
      <Combobox
        selected={selectedOption}
        setSelected={(option) => {
          onChange(option?.value || null);
        }}
        options={isLoading ? undefined : options}
        icon={<DiamondTurnRight className="size-4 text-neutral-500" />}
        searchPlaceholder="Search or add a template..."
        emptyState={
          <div className="p-2 text-center">
            <p className="text-sm text-neutral-500">No templates found</p>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowAddEditUtmTemplateModal(true);
              }}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Create new template
            </button>
          </div>
        }
        buttonProps={{
          className:
            "h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-700 hover:bg-neutral-50 focus-within:border-neutral-400",
          disabled,
        }}
        open={isOpen}
        onOpenChange={setIsOpen}
        caret={true}
        matchTriggerWidth
      >
        {selectedOption ? (
          <div className="flex items-center gap-2">
            <UtmTemplateBadge
              name={selectedOption.data.name}
              color={(selectedOption.data as any).color || "blue"}
            />
          </div>
        ) : (
          <span className="text-neutral-400">Select a template...</span>
        )}
      </Combobox>
    </>
  );
}

