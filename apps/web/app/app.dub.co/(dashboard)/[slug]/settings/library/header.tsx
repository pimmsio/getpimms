"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { TabSelect } from "@dub/ui";
import { cn } from "@dub/utils";
import { redirect, useRouter, useSelectedLayoutSegment } from "next/navigation";
import { text } from "@/ui/design/tokens";

export default function LibraryHeader() {
  const router = useRouter();
  const { slug, flags } = useWorkspace();

  const selectedLayoutSegment = useSelectedLayoutSegment();
  const page = selectedLayoutSegment === null ? "" : selectedLayoutSegment;

  if (selectedLayoutSegment === null) {
    redirect(`/${slug}/settings/library/${flags?.linkFolders ? "folders" : "tags"}`);
  }

  return (
    <div className="border-b border-neutral-100">
      <div className={text.pageTitle}>Library</div>
      <p className={cn("mb-2 mt-2", text.pageDescription)}>
        Manage tags (and folders) to organize your links.
      </p>
      <TabSelect
        variant="accent"
        options={[
          ...(flags?.linkFolders
            ? [
                {
                  id: "folders",
                  label: "Folders",
                },
              ]
            : []),
          { id: "tags", label: "Tags" },
        ]}
        selected={page}
        onSelect={(id) => {
          router.push(`/${slug}/settings/library/${id}`);
        }}
      />
    </div>
  );
}
