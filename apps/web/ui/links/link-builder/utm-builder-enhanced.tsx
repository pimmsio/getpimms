"use client";

import { cn, normalizeUtmValue } from "@dub/utils";
import { ReactNode } from "react";
import { UtmSourceSelect } from "./utm-source-select";
import { UtmMediumSelect } from "./utm-medium-select";
import { UtmCampaignSelect } from "./utm-campaign-select";
import { UtmTermSelect } from "./utm-term-select";
import { UtmContentSelect } from "./utm-content-select";

const UTM_FIELDS = [
  {
    key: "utm_campaign",
    label: "Campaign",
    placeholder: "black-friday",
    description: "Use to identify your campaign",
    example: "e.g. black-friday, launch-new-product",
    Component: UtmCampaignSelect,
  },
  {
    key: "utm_medium",
    label: "Medium",
    placeholder: "email",
    description: "Use to identify the type of content",
    example: "e.g. email, social-post, meta-ad",
    Component: UtmMediumSelect,
  },
  {
    key: "utm_source",
    label: "Source",
    placeholder: "linkedin",
    description: "Use to identify which site or software send the traffic",
    example: "e.g. linkedin, brevo, meta",
    Component: UtmSourceSelect,
  },
  {
    key: "utm_content",
    label: "Content",
    placeholder: "post-1",
    description: "Use to differentiate the content",
    example: "e.g. post-1, email-2, ad-3",
    Component: UtmContentSelect,
  },
  {
    key: "utm_term",
    label: "Term",
    placeholder: "keyword",
    description: "Use to add a list of keywords",
    example: "e.g. marketing, saas, automation",
    Component: UtmTermSelect,
  },
] as const;

export function UTMBuilderEnhanced({
  values,
  onChange,
  disabled,
  disabledTooltip,
  className,
}: {
  values: Record<string, string | null | undefined>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
  disabledTooltip?: string | ReactNode;
  className?: string;
}) {
  const handleChange = (key: string, value: string) => {
    // Apply normalization when value changes
    const normalized = value ? normalizeUtmValue(value) : "";
    onChange(key, normalized);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {UTM_FIELDS.map(({ key, label, description, example, Component }) => (
        <div key={key} className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <label className="text-sm font-medium text-neutral-900">
              {label}
            </label>
            <span className="text-xs text-neutral-500">{description}</span>
          </div>
          <Component
            value={values[key]}
            onChange={(value) => handleChange(key, value)}
            disabled={disabled}
            disabledTooltip={
              typeof disabledTooltip === "string" ? disabledTooltip : undefined
            }
            className="border-neutral-200 focus-within:border-neutral-400"
          />
          <p className="text-xs text-neutral-400">{example}</p>
        </div>
      ))}

      {/* Ref - Keep as text input since it's not a standard UTM parameter */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <label className="text-sm font-medium text-neutral-900">
            Referral
          </label>
          <span className="text-xs text-neutral-500">
            Optional referral parameter
          </span>
        </div>
        <input
          type="text"
          placeholder="linkedin.com"
          disabled={disabled || Boolean(disabledTooltip)}
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm placeholder-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:bg-neutral-50"
          value={values.ref || ""}
          onChange={(e) => handleChange("ref", e.target.value)}
        />
        <p className="text-xs text-neutral-400">e.g. linkedin.com</p>
      </div>
    </div>
  );
}

