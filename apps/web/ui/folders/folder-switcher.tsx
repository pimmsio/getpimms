import { unsortedLinks } from "@/lib/folder/constants";
import useFolder from "@/lib/swr/use-folder";
import useWorkspace from "@/lib/swr/use-workspace";
import { FolderSummary } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FolderActions } from "./folder-actions";
import { FolderDropdown } from "./folder-dropdown";

export const FolderSwitcher = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { slug, defaultFolderId } = useWorkspace();
  const [folderId, setFolderId] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<FolderSummary | null>(
    null,
  );

  // Update folderId based on URL params or default
  useEffect(() => {
    const paramFolderId = searchParams.get("folderId");

    if (!paramFolderId) {
      setFolderId(defaultFolderId || "");
    } else {
      setFolderId(paramFolderId);
    }
  }, [searchParams, defaultFolderId]);

  const { folder } = useFolder({
    folderId,
    enabled: !!folderId,
  });

  useEffect(() => {
    if (folderId === "unsorted") {
      setSelectedFolder(unsortedLinks);
    } else if (folder) {
      setSelectedFolder(folder);
    } else {
      setSelectedFolder(unsortedLinks);
    }
  }, [folder, folderId]);

  return (
    <div className="flex w-full items-center gap-1">
      <FolderDropdown hideFolderIcon={true} />

      {selectedFolder && (
        <FolderActions
          folder={selectedFolder}
          onDelete={() => router.push(`/${slug}`)}
        />
      )}
    </div>
  );
};
