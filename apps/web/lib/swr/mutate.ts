"use client";

import { useCallback, useEffect } from "react";
import { mutate as globalMutate, useSWRConfig } from "swr";

type PrefixArg = string | string[];
type MutateFn = typeof globalMutate;
type CacheType = Map<string, any>;

let boundMutate: MutateFn | null = null;
let boundCache: CacheType | null = null;

const matchesPrefix = (key: string, prefix: PrefixArg) =>
  typeof key === "string" &&
  (Array.isArray(prefix)
    ? prefix.some((p) => key.startsWith(p))
    : key.startsWith(prefix));

const mutateWithCache = async (prefix: PrefixArg, mutateFn: MutateFn, cache?: CacheType) => {
  // Get all matching keys first
  const matchedKeys: string[] = [];
  if (cache) {
    const keys = Array.from(cache.keys());
    keys.forEach((key) => {
      if (typeof key === "string" && matchesPrefix(key, prefix)) {
        matchedKeys.push(key);
      }
    });
  }
  
  // Mutate each key individually to force refetch
  if (matchedKeys.length > 0) {
    const promises = matchedKeys.map((key) => {
      return mutateFn(key, undefined, { revalidate: true });
    });
    
    await Promise.all(promises);
  }
  
  return;
};

export const mutatePrefix = (prefix: PrefixArg) =>
  mutateWithCache(prefix, boundMutate || globalMutate, boundCache || undefined);

export const useMutatePrefix = () => {
  const { mutate, cache } = useSWRConfig();

  useEffect(() => {
    boundMutate = mutate as MutateFn;
    boundCache = cache as CacheType;
    return () => {
      if (boundMutate === mutate) {
        boundMutate = null;
        boundCache = null;
      }
    };
  }, [mutate, cache]);

  return useCallback(
    (prefix: PrefixArg) => mutateWithCache(prefix, mutate as MutateFn, cache as CacheType),
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
