"use client";

import { useCallback, useEffect } from "react";
import { mutate as globalMutate, useSWRConfig } from "swr";

type PrefixArg = string | string[];
type MutateFn = typeof globalMutate;
type CacheType = Map<string, any>;

let boundMutate: MutateFn | null = null;
let boundCache: CacheType | null = null;
const pendingPrefixes: PrefixArg[] = [];

const prefixToKey = (prefix: PrefixArg) =>
  Array.isArray(prefix) ? prefix.join("|") : prefix;

const matchesPrefix = (key: string, prefix: PrefixArg) =>
  typeof key === "string" &&
  (Array.isArray(prefix)
    ? prefix.some((p) => key.startsWith(p))
    : key.startsWith(prefix));

const mutateWithCache = async (prefix: PrefixArg, mutateFn: MutateFn) => {
  const predicate = (key: unknown) =>
    typeof key === "string" && matchesPrefix(key, prefix);

  // Revalidate via SWR's built-in key-filter mutate so the mutate function's own cache is used.
  // This avoids missing keys when `cache` and `mutateFn` aren't aligned (timing/provider edge cases).
  await (mutateFn as any)(predicate, undefined, { revalidate: true });

  return;
};

export const mutatePrefix = async (prefix: PrefixArg) => {
  if (!boundMutate && !boundCache) {
    const key = prefixToKey(prefix);
    if (!pendingPrefixes.some((p) => prefixToKey(p) === key)) {
      pendingPrefixes.push(prefix);
    }
    return;
  }

  await mutateWithCache(prefix, boundMutate || globalMutate);
};

export async function optimisticPrependToPrefix(prefix: PrefixArg, item: any) {
  const cache = boundCache;
  const mutateFn = boundMutate || globalMutate;

  const keys = cache ? Array.from(cache.keys()) : [];
  const matchedKeys = keys.filter(
    (k): k is string => typeof k === "string" && matchesPrefix(k, prefix),
  );

  if (!cache || matchedKeys.length === 0) {
    const key = prefixToKey(prefix);
    if (!pendingPrefixes.some((p) => prefixToKey(p) === key)) {
      pendingPrefixes.push(prefix);
    }
    return;
  }

  await Promise.all(
    matchedKeys.map((key) =>
      (mutateFn as any)(
        key,
        (current: any) => {
          if (!Array.isArray(current)) return current;
          const id = item && typeof item.id === "string" ? item.id : null;
          if (id && current.some((x) => x && x.id === id)) return current;
          const next = [item, ...current];
          return next.length > 100 ? next.slice(0, 100) : next;
        },
        { revalidate: false },
      ),
    ),
  );
}

export const useMutatePrefix = () => {
  const { mutate, cache } = useSWRConfig();

  useEffect(() => {
    boundMutate = mutate as MutateFn;
    boundCache = cache as CacheType;

    if (pendingPrefixes.length > 0) {
      const queued = [...pendingPrefixes];
      pendingPrefixes.length = 0;
      queued.forEach((prefix) => {
        mutateWithCache(prefix, mutate as MutateFn).catch(() => {});
      });
    }
    return () => {
      if (boundMutate === mutate) {
        boundMutate = null;
        boundCache = null;
      }
    };
  }, [mutate, cache]);

  return useCallback(
    (prefix: PrefixArg) => mutateWithCache(prefix, mutate as MutateFn),
    [mutate, cache],
  );
};

const matchesSuffix = (key: string, suffix: string | string[]) =>
  typeof key === "string" &&
  (Array.isArray(suffix)
    ? suffix.some((s) => key.endsWith(s))
    : key.endsWith(suffix));

export const mutateSuffix = async (suffix: string | string[]) => {
  // Get all matching keys first
  const matchedKeys: string[] = [];
  if (boundCache) {
    const keys = Array.from(boundCache.keys());
    keys.forEach((key) => {
      if (typeof key === "string" && matchesSuffix(key, suffix)) {
        matchedKeys.push(key);
      }
    });
  }

  // Mutate each key individually
  if (matchedKeys.length > 0) {
    const promises = matchedKeys.map((key) => {
      return globalMutate(key, undefined, { revalidate: true });
    });

    await Promise.all(promises);
  }

  return;
};
