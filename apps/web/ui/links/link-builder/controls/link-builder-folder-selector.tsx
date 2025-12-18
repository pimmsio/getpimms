import { FolderDropdown } from "@/ui/folders/folder-dropdown";
import { useFormContext, useWatch } from "react-hook-form";
import { LinkFormData } from "../link-builder-provider";

export function LinkBuilderFolderSelector() {
  const { setValue } = useFormContext<LinkFormData>();
  const folderId = useWatch({ name: "folderId" });

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-sm font-medium text-neutral-700">Folder</h2>
      </div>
      <FolderDropdown
        variant="input"
        hideViewAll={true}
        disableAutoRedirect={true}
        onFolderSelect={(folder) => {
          setValue("folderId", folder.id === "unsorted" ? null : folder.id, {
            shouldDirty: true,
          });
        }}
        // Let FolderDropdown own the unified trigger styling (app-btn-secondary)
        buttonClassName="w-full"
        buttonTextClassName="text-sm font-medium"
        iconClassName="size-3"
        selectedFolderId={folderId ?? undefined}
        loadingPlaceholder={
          <div className="my-px h-10 w-full animate-pulse rounded bg-neutral-200 md:h-8" />
        }
      />
    </div>
  );
}
