import { UTM_PARAMETERS } from "@dub/ui";

export const UTM_FILTER_KEYS = UTM_PARAMETERS.filter(({ key }) => key !== "ref").map(
  ({ key }) => key,
);

export function isUtmFilter(key: string): boolean {
  return (UTM_FILTER_KEYS as readonly string[]).includes(key);
}

