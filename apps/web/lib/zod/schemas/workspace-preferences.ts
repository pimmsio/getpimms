import {
  linksDisplayPropertyIds,
  linksGroupByOptions,
  linksSortOptions,
  linksViewModes,
} from "@/lib/links/links-display";
import { z } from "zod";

export const linksDisplaySchema = z.object({
  viewMode: z.enum(linksViewModes),
  sortBy: z.enum(
    linksSortOptions.map(({ slug }) => slug) as [string, ...string[]],
  ),
  groupBy: z
    .enum(
      linksGroupByOptions.map(({ slug }) => slug ?? "null") as [
        string,
        ...string[],
      ],
    )
    .transform((val) => (val === "null" ? null : val))
    .nullable()
    .optional(),
  showArchived: z.boolean(),
  displayProperties: z.array(z.enum(linksDisplayPropertyIds)),
  switchPosition: z.boolean().optional(),
});

export const workspacePreferencesValueSchemas = {
  linksDisplay: linksDisplaySchema.nullish(),
} as const;

export const workspacePreferencesSchema = z.object(
  workspacePreferencesValueSchemas,
);

export type WorkspacePreferencesKey =
  keyof typeof workspacePreferencesValueSchemas;

export type WorkspacePreferencesValue<K extends WorkspacePreferencesKey> =
  z.infer<(typeof workspacePreferencesValueSchemas)[K]>;
