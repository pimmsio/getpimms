"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { AppButton, AppButtonProps } from "@/ui/components/controls/app-button";
import { cn } from "@dub/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function ManageSubscriptionButton(
  props: Omit<AppButtonProps, "children"> & { text?: string },
) {
  const { id: workspaceId } = useWorkspace();
  const [clicked, setClicked] = useState(false);
  const router = useRouter();

  return (
    <AppButton
      {...props}
      className={cn(props.className, "h-9")}
      onClick={() => {
        setClicked(true);
        fetch(`/api/workspaces/${workspaceId}/billing/manage`, {
          method: "POST",
        }).then(async (res) => {
          if (res.ok) {
            const url = await res.json();
            router.push(url);
          } else {
            const { error } = await res.json();
            toast.error(error.message);
            setClicked(false);
          }
        });
      }}
      loading={clicked}
    >
      {props.text || "Manage Subscription"}
    </AppButton>
  );
}
