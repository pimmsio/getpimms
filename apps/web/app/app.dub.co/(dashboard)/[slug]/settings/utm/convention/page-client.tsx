"use client";

import { clientAccessCheck } from "@/lib/api/tokens/permissions";
import useWorkspace from "@/lib/swr/use-workspace";
import { text } from "@/ui/design/tokens";
import { Form, SelectForm, Switch } from "@dub/ui";
import { cn } from "@dub/utils";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

const SPACE_CHAR_OPTIONS = [
  { value: "-", label: "Hyphen (-)" },
  { value: "_", label: "Underscore (_)" },
  { value: ".", label: "Dot (.)" },
  { value: "", label: "None (remove spaces)" },
];

export default function UtmConventionClient() {
  const {
    id,
    slug,
    role,
    utmSpaceChar,
    utmProhibitedChars,
    utmForceLowercase,
  } = useWorkspace();

  const permissionsError = clientAccessCheck({
    action: "workspaces.write",
    role,
  }).error;

  const [savingLowercase, setSavingLowercase] = useState(false);

  const patchWorkspace = async (data: Record<string, unknown>) => {
    const res = await fetch(`/api/workspaces/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      await Promise.all([
        mutate("/api/workspaces"),
        mutate(`/api/workspaces/${id}`),
        slug && mutate(`/api/workspaces/${slug}`),
      ]);
      return true;
    }

    const { error } = await res.json();
    toast.error(error.message);
    return false;
  };

  return (
    <div className="grid gap-5">
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className={cn(text.pageTitle, "text-lg")}>UTM Convention</h2>
        <p className={cn(text.pageDescription, "mt-1 text-sm")}>
          Ensure consistent performance and analysis with customizable link
          rules.
        </p>
        <ul className="mt-4 grid gap-2 text-sm text-neutral-600">
          <li>
            Set standards for link creation within your workspace to ensure
            accuracy and consistency.
          </li>
          <li>
            Enforce naming conventions, attributes, and other parameters for all
            members of your team.
          </li>
          <li>
            Avoid confusion and errors by clearly defining the expected
            parameters for each link.
          </li>
          <li>
            Improve the efficiency and effectiveness of your link management
            process.
          </li>
        </ul>
      </div>

      <SelectForm
        title="Space character"
        description="Replaces spaces in campaign parameters with the selected character."
        selectAttrs={{
          name: "utmSpaceChar",
          defaultValue: utmSpaceChar ?? "-",
        }}
        options={SPACE_CHAR_OPTIONS}
        helpText="Applied when creating or editing links."
        disabledTooltip={permissionsError || undefined}
        handleSubmit={async (data) => {
          const ok = await patchWorkspace(data);
          if (ok) toast.success("Space character updated!");
        }}
      />

      <Form
        title="Prohibited characters"
        description="Characters which are not allowed to use in the builder, separated with a comma."
        inputAttrs={{
          name: "utmProhibitedChars",
          defaultValue: utmProhibitedChars ?? "",
          placeholder: "e.g. [,]",
          maxLength: 200,
        }}
        helpText="Comma-separated list. Max 200 characters."
        disabledTooltip={permissionsError || undefined}
        handleSubmit={async (data) => {
          const ok = await patchWorkspace(data);
          if (ok) toast.success("Prohibited characters updated!");
        }}
      />

      <div className="rounded border border-neutral-200 bg-white">
        <div className="flex items-center justify-between p-5 sm:p-10">
          <div className="flex flex-col space-y-3">
            <h2 className="text-xl font-medium">
              Force all campaigns parameters to lowercase
            </h2>
            <p className="text-sm text-neutral-500">
              Helps maintain consistency across your workspace.
            </p>
          </div>
          <Switch
            checked={utmForceLowercase ?? true}
            loading={savingLowercase}
            disabled={!!permissionsError}
            disabledTooltip={permissionsError || undefined}
            fn={async (checked: boolean) => {
              setSavingLowercase(true);
              const ok = await patchWorkspace({
                utmForceLowercase: checked,
              });
              if (ok) {
                toast.success(
                  checked ? "Lowercase enforced!" : "Lowercase enforcement disabled!",
                );
              }
              setSavingLowercase(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}
