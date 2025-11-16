"use client";

import { useCallback, useEffect } from "react";
import { mutate as globalMutate, useSWRConfig } from "swr";

type PrefixArg = string | string[];
type MutateFn = typeof globalMutate;

let boundMutate: MutateFn | null = null;

const matchesPrefix = (key: string, prefix: PrefixArg) =>
  typeof key === "string" &&
  (Array.isArray(prefix)
    ? prefix.some((p) => key.startsWith(p))
    : key.startsWith(prefix));

const mutateWithCache = (prefix: PrefixArg, mutateFn: MutateFn) =>
  mutateFn(
    (key) => {
      const matches = matchesPrefix(key as string, prefix);
      return matches;
    },
    undefined,
    { revalidate: true, populateCache: false },
  );

export const mutatePrefix = (prefix: PrefixArg) =>
  mutateWithCache(prefix, boundMutate || globalMutate);

export const useMutatePrefix = () => {
  const { mutate } = useSWRConfig();

  useEffect(() => {
    boundMutate = mutate as MutateFn;
    return () => {
      if (boundMutate === mutate) {
        boundMutate = null;
      }
    };
  }, [mutate]);

  return useCallback(
    (prefix: PrefixArg) => mutateWithCache(prefix, mutate as MutateFn),
    [mutate],
  );
};

export const mutateSuffix = (suffix: string | string[]) =>
  globalMutate(
    (key) =>
      typeof key === "string" &&
      (Array.isArray(suffix)
        ? suffix.some((s) => (key as string).endsWith(s))
        : (key as string).endsWith(suffix)),
    undefined,
    {
      revalidate: true,
    },
  );
