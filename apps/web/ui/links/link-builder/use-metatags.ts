import {
  LinkFormData,
  useLinkBuilderContext,
} from "@/ui/links/link-builder/link-builder-provider";
import { fetcher, getDomainWithoutWWW, getUrlWithoutUTMParams, truncate } from "@dub/utils";
import { useEffect, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { mutate } from "swr";
import { useDebounce } from "use-debounce";

export function useMetatags({ enabled = true }: { enabled?: boolean } = {}) {
  const { control, setValue, getValues } = useFormContext<LinkFormData>();
  const [url, password, proxy, doIndex, title, description, image] = useWatch({
    control,
    name: [
      "url",
      "password",
      "proxy",
      "doIndex",
      "title",
      "description",
      "image",
    ],
  });
  const [debouncedUrl] = useDebounce(getUrlWithoutUTMParams(url), 500);

  const { generatingMetatags, setGeneratingMetatags, props, duplicateProps } =
    useLinkBuilderContext();

  // Flag to skip auto-fetch after discard
  const isDiscardingRef = useRef<boolean>(false);

  // Track previous values to detect changes
  const prevValuesRef = useRef<{ url: string; domain: string | null; doIndex: boolean }>({
    url: "",
    domain: null,
    doIndex: false,
  });
  const hasInitialized = useRef<boolean>(false);

  // Helper function to fetch metadata via SWR
  const fetchMetadata = async (url: string, revalidate = false) => {
    const swrKey = `/api/metatags?url=${encodeURIComponent(url)}`;

    return mutate<{
      title: string | null;
      description: string | null;
      image: string | null;
    }>(swrKey, async () => fetcher(swrKey), {
      revalidate,
      populateCache: true,
      optimisticData: undefined,
    });
  };

  // Unified metadata refresh function
  const refreshMetadata = async (
    options: {
      revalidate?: boolean;
      clearFirst?: boolean;
      shouldDirty?: boolean;
    } = {},
  ) => {
    const {
      revalidate = false,
      clearFirst = false,
      shouldDirty = false,
    } = options;
    const currentUrl = getValues("url");

    if (!currentUrl) {
      return;
    }

    setGeneratingMetatags(true);

    try {
      const results = await fetchMetadata(currentUrl, revalidate);

      if (results) {
        // Truncate title and description to match useMetatags behavior
        const truncatedTitle = truncate(results.title, 120);
        const truncatedDescription = truncate(results.description, 240);

        // Clear first if requested (but only AFTER we have fresh data)
        if (clearFirst) {
          setValue("proxy", false, { shouldDirty });
        }

        // Update form with fresh metadata - all at once to avoid flashing
        setValue("title", truncatedTitle, { shouldDirty });
        setValue("description", truncatedDescription, { shouldDirty });
        setValue("image", results.image, { shouldDirty });
        setValue("proxy", true, { shouldDirty });

        return {
          title: truncatedTitle,
          description: truncatedDescription,
          image: results.image,
        };
      }
    } catch (error) {
      console.error("❌ Failed to fetch metadata via SWR:", error);
    } finally {
      setTimeout(() => setGeneratingMetatags(false), 200);
    }
  };

  useEffect(() => {
    // Handle password-protected links
    if (password) {
      setGeneratingMetatags(false);
      setValue("title", "Password Required");
      setValue(
        "description",
        "This link is password protected. Please enter the password to view it.",
      );
      setValue("image", "https://assets.dub.co/misc/password-protected.png");
      return;
    }

    // Skip if we're discarding
    if (isDiscardingRef.current) {
      // Update prevValuesRef to current values and clear discard flag
      const currentDomain = debouncedUrl ? (getDomainWithoutWWW(debouncedUrl) ?? null) : null;
      prevValuesRef.current = { url: debouncedUrl, domain: currentDomain, doIndex };
      isDiscardingRef.current = false;
      setGeneratingMetatags(false);
      return;
    }

    // Check what actually changed (only URL for this useEffect)
    const urlChanged = prevValuesRef.current.url !== debouncedUrl;
    const currentDomain = debouncedUrl ? (getDomainWithoutWWW(debouncedUrl) ?? null) : null;
    const prevDomain = prevValuesRef.current.domain;
    const domainChanged = prevDomain !== currentDomain;
    const isNewLink = !props && !duplicateProps;

    // Determine if we should auto-fetch (only for URL changes)
    let shouldAutoFetch = false;

    if (isNewLink) {
      // New links: fetch if URL exists
      shouldAutoFetch = debouncedUrl.length > 0;
    } else {
      // Existing links (including duplicates):
      // - Don't fetch on first render IF metadata exists (show saved values)
      // - Auto-fetch if metadata is missing OR if domain changed (different site = different preview)
      if (!hasInitialized.current) {
        hasInitialized.current = true;
        // Auto-fetch if metadata is missing (null or empty)
        const hasMetadata = title || description || image;
        shouldAutoFetch = !hasMetadata && debouncedUrl.length > 0;
        // Store initial domain
        prevValuesRef.current.domain = currentDomain;
      } else {
        // After initialization:
        // - Always refresh if domain changed (different site = different preview)
        // - Keep existing metadata if same domain (even if path changed) - user can refresh manually
        // - Only auto-refresh if metadata is missing
        const hasMetadata = title || description || image;
        if (domainChanged && urlChanged) {
          // Domain changed - always refresh (different site)
          shouldAutoFetch = debouncedUrl.length > 0;
        } else if (urlChanged && !domainChanged) {
          // URL changed but same domain - keep existing metadata, don't auto-refresh
          // User can use refresh button if they want to update
          shouldAutoFetch = false;
        } else if (!hasMetadata && debouncedUrl.length > 0) {
          // No URL change but metadata missing - fetch it
          shouldAutoFetch = true;
        }
      }
    }

    // Update previous URL and domain AFTER the decision (doIndex handled in separate useEffect)
    prevValuesRef.current.url = debouncedUrl;
    prevValuesRef.current.domain = currentDomain;

    if (enabled !== false && shouldAutoFetch) {
      try {
        // Validate URL
        new URL(debouncedUrl);

        setGeneratingMetatags(true);

        // Use the same SWR logic for automatic fetching
        fetchMetadata(debouncedUrl, false)
          .then((results) => {
            if (results) {
              // Truncate title and description
              const truncatedTitle = truncate(results.title, 120);
              const truncatedDescription = truncate(results.description, 240);

              // Only update if values are different to avoid unnecessary re-renders
              if (title !== truncatedTitle) {
                setValue("title", truncatedTitle, { shouldDirty: false });
              }
              if (description !== truncatedDescription) {
                setValue("description", truncatedDescription, {
                  shouldDirty: false,
                });
              }
              if (image !== results.image) {
                setValue("image", results.image, { shouldDirty: false });
              }

              // Set proxy if not doIndex
              if (!doIndex) {
                setValue("proxy", true, { shouldDirty: false });
              }
            }
          })
          .finally(() => {
            setTimeout(() => setGeneratingMetatags(false), 200);
          });
      } catch (_) {
        setGeneratingMetatags(false);
      }
    } else {
      setGeneratingMetatags(false);
    }
  }, [debouncedUrl, password, enabled]);

  // Separate useEffect for doIndex changes only
  useEffect(() => {
    // Skip if we're discarding
    if (isDiscardingRef.current) {
      isDiscardingRef.current = false; // Clear flag
      return;
    }

    // Only handle doIndex changes after initialization  
    if (!hasInitialized.current || !enabled || !debouncedUrl.length) {
      return;
    }

    const doIndexChanged = prevValuesRef.current.doIndex !== doIndex;
    if (doIndexChanged) {
      prevValuesRef.current.doIndex = doIndex;
      
      try {
        new URL(debouncedUrl);
        setGeneratingMetatags(true);
        fetchMetadata(debouncedUrl, false)
          .then((results) => {
            if (results) {
              const truncatedTitle = truncate(results.title, 120);
              const truncatedDescription = truncate(results.description, 240);

              if (title !== truncatedTitle) {
                setValue("title", truncatedTitle, { shouldDirty: false });
              }
              if (description !== truncatedDescription) {
                setValue("description", truncatedDescription, { shouldDirty: false });
              }
              if (image !== results.image) {
                setValue("image", results.image, { shouldDirty: false });
              }

              if (!doIndex) {
                setValue("proxy", true, { shouldDirty: false });
              }
            }
          })
          .finally(() => {
            setTimeout(() => setGeneratingMetatags(false), 200);
          });
      } catch (_) {
        setGeneratingMetatags(false);
      }
    }
  }, [doIndex]);

  // Function to mark that we're discarding (skips next useEffect)
  const skipNextAutoFetch = () => {
    isDiscardingRef.current = true;
  };

  return { generatingMetatags, refreshMetadata, skipNextAutoFetch };
}
