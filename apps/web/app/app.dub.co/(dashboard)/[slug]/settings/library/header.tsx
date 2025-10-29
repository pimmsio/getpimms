"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { TabSelect } from "@dub/ui";
import { redirect, useRouter, useSelectedLayoutSegment } from "next/navigation";

export default function LibraryHeader() {
  const router = useRouter();
  const { slug, flags } = useWorkspace();

  const selectedLayoutSegment = useSelectedLayoutSegment();
  const page = selectedLayoutSegment === null ? "" : selectedLayoutSegment;

  if (selectedLayoutSegment === null) {
    redirect(`/${slug}/settings/library/utm`);
  }

  return (
    <div className="border-b border-neutral-100">
      <h1 className="text-2xl font-semibold tracking-tight text-black">
        Library
      </h1>
      <p className="mb-2 mt-2 text-base text-neutral-600">
        Manage tags to organize your links, UTM parameters, and create UTM templates.
      </p>
      <TabSelect
        variant="accent"
        options={[
          { id: "parameters", label: "UTM Parameters" },
          { id: "utm", label: "UTM Templates" },
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
