"use client";

import { LinkFormData } from "@/ui/links/link-builder/link-builder-provider";
import { toast } from "sonner";
import { mutate } from "swr";

export async function bulkCreateLinks({
  urls,
  formData,
  workspaceId,
  onSuccess,
}: {
  urls: string[];
  formData: LinkFormData;
  workspaceId: string;
  onSuccess: () => void;
}) {
  try {
    toast.loading(`Creating ${urls.length} links...`);

    const promises: Promise<Response>[] = [];

    // Create one link per URL (auto-generate keys)
    for (const url of urls) {
      promises.push(
        fetch(`/api/links?workspaceId=${workspaceId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            url,
          }),
        }),
      );
    }

    const results = await Promise.allSettled(promises);

    const successful = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");

    toast.dismiss();

    if (successful.length > 0) {
      toast.success(`Successfully created ${successful.length} link(s)`);
      // Invalidate SWR cache to refresh the links list
      await mutate((key) => typeof key === "string" && key.startsWith("/api/links"));
    }

    if (failed.length > 0) {
      toast.error(`Failed to create ${failed.length} link(s)`);
    }

    if (successful.length > 0) {
      onSuccess();
    }
  } catch (error) {
    toast.dismiss();
    toast.error("An error occurred while creating links");
    console.error(error);
  }
}

