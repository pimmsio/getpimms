import { TagProps } from "@/lib/types";
import { fetcher } from "@dub/utils";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { z } from "zod";
import { getTagsQuerySchema } from "../zod/schemas/tags";
import useWorkspace from "./use-workspace";

const partialQuerySchema = getTagsQuerySchema.partial();

export default function useTags({
  query,
  enabled = true,
  includeLinksCount = false,
}: {
  query?: z.infer<typeof partialQuerySchema>;
  enabled?: boolean;
  includeLinksCount?: boolean;
} = {}) {
  const { id } = useWorkspace();

  // Detect if we're on admin
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.host.startsWith("admin.")) {
      setIsAdmin(true);
    }
  }, []);

  const { data: tags, isValidating } = useSWR<TagProps[]>(
    enabled &&
      (isAdmin
        ? `/api/admin/tags?${new URLSearchParams({
            ...query,
            includeLinksCount,
          } as Record<string, any>).toString()}`
        : id &&
          `/api/tags?${new URLSearchParams({
            workspaceId: id,
            ...query,
            includeLinksCount,
          } as Record<string, any>).toString()}`),
    fetcher,
    {
      dedupingInterval: 60000,
    },
  );

  return {
    tags,
    loading: tags ? false : true,
    isValidating,
  };
}
