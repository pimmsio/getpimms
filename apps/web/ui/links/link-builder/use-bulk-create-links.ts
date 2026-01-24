"use client";

import { LinkFormData } from "@/ui/links/link-builder/link-builder-provider";
import type { BulkUtmTemplateSelection } from "@/ui/links/link-builder/bulk-utm-parameters-section";
import { generateBulkComboId } from "@/ui/links/link-builder/bulk-link-utils";
import { toast } from "sonner";
import { mutatePrefix } from "@/lib/swr/mutate";

function pushLink(
  linksPayload: Record<string, unknown>[],
  seenDomainKey: Set<string>,
  formData: LinkFormData,
  link: {
    url: string;
    key: string;
    domain: string;
    utm_campaign?: string;
    utm_medium?: string;
    utm_source?: string;
    utm_content?: string;
    utm_term?: string;
  },
) {
  const d = link.domain || "";
  const k = link.key || "";
  const id = `${d}\0${k}`;
  const key = seenDomainKey.has(id) ? "" : k;
  if (key) seenDomainKey.add(id);
  const { utm_campaign, utm_medium, utm_source, utm_content, utm_term } = link;
  linksPayload.push({
    ...formData,
    url: link.url,
    key,
    domain: link.domain,
    ...(utm_campaign != null && { utm_campaign }),
    ...(utm_medium != null && { utm_medium }),
    ...(utm_source != null && { utm_source }),
    ...(utm_content != null && { utm_content }),
    ...(utm_term != null && { utm_term }),
  });
}

export async function bulkCreateLinks({
  urls,
  templates,
  formData,
  workspaceId,
  bulkKeyByCombo,
  bulkDomainByCombo,
  onSuccess,
}: {
  urls: string[];
  templates?: BulkUtmTemplateSelection[];
  formData: LinkFormData;
  workspaceId: string;
  bulkKeyByCombo?: Record<string, string>;
  bulkDomainByCombo?: Record<string, string>;
  onSuccess: () => void;
}) {
  try {
    const hasTemplates = Boolean(templates && templates.length > 0);
    const totalLinks = hasTemplates
      ? urls.length * templates!.length
      : urls.length;

    toast.loading(`Creating ${totalLinks} links...`);

    const linksPayload: Record<string, unknown>[] = [];
    const seenDomainKey = new Set<string>();

    for (const url of urls) {
      if (hasTemplates) {
        for (const template of templates!) {
          const comboId = generateBulkComboId(url, template.instanceId);
          const comboKey = bulkKeyByCombo?.[comboId] ?? formData.key ?? "";
          const comboDomain =
            bulkDomainByCombo?.[comboId] ?? formData.domain ?? "";
          pushLink(linksPayload, seenDomainKey, formData, {
            url,
            key: comboKey,
            domain: comboDomain,
            utm_campaign: template.utm_campaign,
            utm_medium: template.utm_medium,
            utm_source: template.utm_source,
            utm_content: template.utm_content,
            utm_term: template.utm_term,
          });
        }
      } else {
        const comboId = generateBulkComboId(url, null);
        const comboKey = bulkKeyByCombo?.[comboId] ?? formData.key ?? "";
        const comboDomain =
          bulkDomainByCombo?.[comboId] ?? formData.domain ?? "";
        pushLink(linksPayload, seenDomainKey, formData, {
          url,
          key: comboKey,
          domain: comboDomain,
        });
      }
    }

    const res = await fetch(`/api/links/bulk?workspaceId=${workspaceId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(linksPayload),
    });

    toast.dismiss();

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json?.error?.message ?? "Failed to create links");
      return;
    }

    const data = (await res.json()) as Array<
      { id: string } | { link: unknown; error: string; code?: string }
    >;
    const successful = data.filter((item): item is { id: string } => "id" in item);
    const failed = data.filter(
      (item): item is { link: unknown; error: string; code?: string } =>
        "error" in item,
    );

    if (successful.length > 0) {
      toast.success(`Successfully created ${successful.length} link(s)`);
      await mutatePrefix("/api/links");
      onSuccess();
    }

    if (failed.length > 0) {
      toast.error(`Failed to create ${failed.length} link(s)`);
    }
  } catch (error) {
    toast.dismiss();
    toast.error("An error occurred while creating links");
    console.error(error);
  }
}
