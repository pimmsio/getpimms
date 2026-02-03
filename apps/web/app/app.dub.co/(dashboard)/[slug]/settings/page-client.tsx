"use client";

import { clientAccessCheck } from "@/lib/api/tokens/permissions";
import useWorkspace from "@/lib/swr/use-workspace";
import DeleteWorkspace from "@/ui/workspaces/delete-workspace";
import UploadLogo from "@/ui/workspaces/upload-logo";
import WorkspaceId from "@/ui/workspaces/workspace-id";
import { Form, SelectForm } from "@dub/ui";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { mutate } from "swr";

export default function WorkspaceSettingsClient() {
  const router = useRouter();
  const { id, name, slug, role, currency } = useWorkspace();

  const permissionsError = clientAccessCheck({
    action: "workspaces.write",
    role,
  }).error;

  const { update } = useSession();

  return (
    <>
      <Form
        title="Workspace name"
        // description={`This is the name of your workspace on ${process.env.NEXT_PUBLIC_APP_NAME}.`}
        inputAttrs={{
          name: "name",
          defaultValue: name,
          placeholder: "My Workspace",
          maxLength: 32,
        }}
        helpText="Max 32 characters."
        disabledTooltip={permissionsError || undefined}
        handleSubmit={(updateData) =>
          fetch(`/api/workspaces/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updateData),
          }).then(async (res) => {
            if (res.status === 200) {
              await Promise.all([
                mutate("/api/workspaces"),
                mutate(`/api/workspaces/${id}`),
              ]);
              toast.success("Successfully updated workspace name!");
            } else {
              const { error } = await res.json();
              toast.error(error.message);
            }
          })
        }
      />
      <Form
        title="Workspace slug"
        // description={`This is your workspace's unique slug on ${process.env.NEXT_PUBLIC_APP_NAME}.`}
        inputAttrs={{
          name: "slug",
          defaultValue: slug,
          placeholder: "my-workspace",
          pattern: "^[a-z0-9-]+$",
          maxLength: 48,
        }}
        helpText="Only lowercase letters, numbers, and dashes. Max 48 characters."
        disabledTooltip={permissionsError || undefined}
        handleSubmit={(data) =>
          fetch(`/api/workspaces/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }).then(async (res) => {
            if (res.status === 200) {
              const { slug: newSlug } = await res.json();
              await mutate("/api/workspaces");
              if (newSlug != slug) {
                router.push(`/${newSlug}/settings`);
                update();
              }
              toast.success("Successfully updated workspace slug!");
            } else {
              const { error } = await res.json();
              toast.error(error.message);
            }
          })
        }
      />
      <SelectForm
        title="Workspace currency"
        description="This only changes the currency symbol shown across your workspace. No conversion is performed."
        selectAttrs={{
          name: "currency",
          defaultValue: currency ?? "EUR",
        }}
        options={[
          { value: "EUR", label: "Euro (EUR)" },
          { value: "USD", label: "US Dollar (USD)" },
        ]}
        disabledTooltip={permissionsError || undefined}
        handleSubmit={(data) =>
          fetch(`/api/workspaces/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }).then(async (res) => {
            if (res.status === 200) {
              await Promise.all([
                mutate("/api/workspaces"),
                mutate(`/api/workspaces/${id}`),
                slug && mutate(`/api/workspaces/${slug}`),
              ]);
              toast.success("Successfully updated workspace currency!");
            } else {
              const { error } = await res.json();
              toast.error(error.message);
            }
          })
        }
      />
      {/* <UploadLogo /> */}
      <WorkspaceId />
      <DeleteWorkspace />
    </>
  );
}
