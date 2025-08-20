import { fetcher } from "@dub/utils";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { z } from "zod";
import { getTagsCountQuerySchema } from "../zod/schemas/tags";
import useWorkspace from "./use-workspace";

const partialQuerySchema = getTagsCountQuerySchema.partial();

export default function useTagsCount({
  query,
}: { query?: z.infer<typeof partialQuerySchema> } = {}) {
  const { id } = useWorkspace();

  // Detect if we're on admin
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.host.startsWith("admin.")) {
      setIsAdmin(true);
    }
  }, []);

  const { data, error } = useSWR<number>(
    isAdmin
      ? `/api/admin/tags/count?${new URLSearchParams({ ...query } as Record<string, any>).toString()}`
      : id &&
        `/api/tags/count?${new URLSearchParams({ workspaceId: id, ...query } as Record<string, any>).toString()}`,
    fetcher,
    {
      dedupingInterval: 60000,
    },
  );

  return {
    data,
    loading: !error && data === undefined,
    error,
  };
}
