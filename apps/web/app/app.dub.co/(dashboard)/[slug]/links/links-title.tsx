"use client";

import { FolderSwitcher } from "@/ui/folders/folder-switcher";

/**
 * Renders the title for the links page ("Links"), or the folder switcher if the linkFolders feature flag is enabled
 * We can remove this component when removing the linkFolders feature flag
 */
export function LinksTitle({
  linkFoldersEnabled,
}: {
  linkFoldersEnabled: boolean;
}) {
  return (
    <div className="min-w-0">
      {linkFoldersEnabled ? <FolderSwitcher /> : "Links"}
    </div>
  );
}
