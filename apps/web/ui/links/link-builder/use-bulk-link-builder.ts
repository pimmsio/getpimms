"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UseFormSetValue } from "react-hook-form";
import type { LinkFormData } from "./link-builder-provider";
import type { BulkUtmTemplateSelection } from "./bulk-utm-parameters-section";
import {
  generateBulkComboId,
  calculateBulkCombos,
  calculateBulkTotalCount,
  calculateBulkComboCount,
  getCurrentBulkUrl,
  type BulkCombo,
} from "./bulk-link-utils";

export function useBulkLinkBuilder(
  urlMode: "single" | "bulk",
  setValue: UseFormSetValue<LinkFormData>,
  workspaceId: string,
  primaryDomain: string | undefined,
  currentUrl: string,
  key: string,
  domain: string,
) {
  // State
  const [bulkUrls, setBulkUrls] = useState<string[]>([]);
  const [bulkTemplates, setBulkTemplates] = useState<
    BulkUtmTemplateSelection[]
  >([]);
  const [bulkActiveTemplateId, setBulkActiveTemplateId] = useState<
    string | null
  >(null);
  const [bulkPreviewIndex, setBulkPreviewIndex] = useState(0);
  const [bulkKeyByCombo, setBulkKeyByCombo] = useState<
    Record<string, string>
  >({});
  const [bulkDomainByCombo, setBulkDomainByCombo] = useState<
    Record<string, string>
  >({});

  // Refs for sync tracking
  const bulkKeySyncRef = useRef<{
    comboId: string;
    targetKey: string;
  } | null>(null);
  const bulkDomainSyncRef = useRef<{
    comboId: string;
    targetDomain: string;
  } | null>(null);
  const bulkKeyGenerationInFlight = useRef<Record<string, boolean>>({});

  // Computed values
  const bulkCombos = useMemo(
    () => calculateBulkCombos(bulkUrls, bulkTemplates),
    [bulkUrls, bulkTemplates],
  );

  const currentBulkUrl = useMemo(
    () => getCurrentBulkUrl(bulkUrls, bulkPreviewIndex),
    [bulkUrls, bulkPreviewIndex],
  );

  const currentTemplateInstanceId =
    bulkActiveTemplateId ?? bulkTemplates[0]?.instanceId ?? null;

  const currentCombo = useMemo<BulkCombo | null>(() => {
    if (!currentBulkUrl) return null;
    return {
      url: currentBulkUrl,
      templateInstanceId: currentTemplateInstanceId,
    };
  }, [currentBulkUrl, currentTemplateInstanceId]);

  const bulkComboId = useMemo(() => {
    return generateBulkComboId(
      currentBulkUrl || "no-url",
      currentTemplateInstanceId || "no-template",
    );
  }, [currentBulkUrl, currentTemplateInstanceId]);

  const bulkTotalCount = useMemo(
    () => calculateBulkTotalCount(bulkUrls, bulkTemplates),
    [bulkUrls, bulkTemplates],
  );

  const bulkComboCount = useMemo(
    () => calculateBulkComboCount(bulkUrls, bulkTemplates),
    [bulkUrls, bulkTemplates],
  );

  // Navigation handlers
  const handleBulkPrev = useCallback(() => {
    setBulkPreviewIndex((idx) => Math.max(0, idx - 1));
  }, []);

  const handleBulkNext = useCallback(() => {
    setBulkPreviewIndex((idx) =>
      Math.min(bulkUrls.length - 1, idx + 1),
    );
  }, [bulkUrls.length]);

  // Reset function
  const resetBulkState = useCallback(() => {
    setBulkUrls([]);
    setBulkTemplates([]);
    setBulkPreviewIndex(0);
    setBulkKeyByCombo({});
    setBulkDomainByCombo({});
    setBulkActiveTemplateId(null);
    bulkKeySyncRef.current = null;
    bulkDomainSyncRef.current = null;
  }, []);

  // Sync logic: Keep preview index in bounds
  useEffect(() => {
    if (urlMode !== "bulk") return;
    if (bulkPreviewIndex > bulkUrls.length - 1) {
      setBulkPreviewIndex(Math.max(0, bulkUrls.length - 1));
    }
  }, [urlMode, bulkUrls.length, bulkPreviewIndex]);

  // Sync logic: Update form URL when combo changes
  useEffect(() => {
    if (urlMode !== "bulk") return;
    if (!currentCombo) return;
    if (currentCombo.templateInstanceId !== bulkActiveTemplateId) {
      setBulkActiveTemplateId(currentCombo.templateInstanceId);
    }
    if (currentUrl === currentCombo.url) return;
    setValue("url", currentCombo.url, { shouldDirty: true });
  }, [
    urlMode,
    currentCombo,
    currentUrl,
    setValue,
    bulkActiveTemplateId,
    bulkCombos.length,
    bulkPreviewIndex,
  ]);

  // Sync logic: Load stored key for current combo
  useEffect(() => {
    if (urlMode !== "bulk") return;
    if (!bulkComboId) return;
    const storedKey = bulkKeyByCombo[bulkComboId];
    bulkKeySyncRef.current = {
      comboId: bulkComboId,
      targetKey: storedKey ?? "",
    };
    setValue("key", storedKey ?? "", { shouldDirty: true });
  }, [urlMode, bulkComboId, bulkKeyByCombo, setValue]);

  // Sync logic: Generate key if missing
  useEffect(() => {
    if (urlMode !== "bulk") return;
    if (!bulkComboId) return;
    if (!currentCombo?.url) return;
    if (!domain) return;
    if (bulkKeyByCombo[bulkComboId]) return;
    if (bulkKeyGenerationInFlight.current[bulkComboId]) return;

    bulkKeyGenerationInFlight.current[bulkComboId] = true;
    fetch(`/api/links/random?domain=${domain}&workspaceId=${workspaceId}`)
      .then((res) => res.json())
      .then((newKey) => {
        setBulkKeyByCombo((prev) => ({ ...prev, [bulkComboId]: newKey }));
        setValue("key", newKey, { shouldDirty: true });
      })
      .finally(() => {
        bulkKeyGenerationInFlight.current[bulkComboId] = false;
      });
  }, [
    urlMode,
    bulkComboId,
    bulkKeyByCombo,
    domain,
    currentCombo,
    workspaceId,
    setValue,
  ]);

  // Sync logic: Load stored domain for current combo
  useEffect(() => {
    if (urlMode !== "bulk") return;
    if (!bulkComboId) return;
    const storedDomain = bulkDomainByCombo[bulkComboId];
    const nextDomain = storedDomain ?? primaryDomain ?? "";
    bulkDomainSyncRef.current = {
      comboId: bulkComboId,
      targetDomain: nextDomain,
    };
    if (nextDomain && domain !== nextDomain) {
      setValue("domain", nextDomain, { shouldDirty: true });
    }
  }, [
    urlMode,
    bulkComboId,
    bulkDomainByCombo,
    primaryDomain,
    setValue,
    domain,
  ]);

  // Sync logic: Store key changes from form
  useEffect(() => {
    if (urlMode !== "bulk") return;
    if (!bulkComboId) return;
    const keySync = bulkKeySyncRef.current;
    if (keySync?.comboId === bulkComboId) {
      if (key === keySync.targetKey) {
        bulkKeySyncRef.current = null;
      }
      return;
    }
    if (!key) return;
    setBulkKeyByCombo((prev) => {
      if (prev[bulkComboId] === key) return prev;
      return { ...prev, [bulkComboId]: key };
    });
  }, [urlMode, bulkComboId, key]);

  // Sync logic: Store domain changes from form
  useEffect(() => {
    if (urlMode !== "bulk") return;
    if (!bulkComboId) return;
    if (!domain) return;
    const domainSync = bulkDomainSyncRef.current;
    if (domainSync?.comboId === bulkComboId) {
      // If domain matches the target that was just synced, store it and clear the ref
      if (domain === domainSync.targetDomain) {
        setBulkDomainByCombo((prev) => {
          if (prev[bulkComboId] === domain) return prev;
          return { ...prev, [bulkComboId]: domain };
        });
        bulkDomainSyncRef.current = null;
      }
      return;
    }
    // Store domain if it's a user change (not from sync)
    setBulkDomainByCombo((prev) => {
      if (prev[bulkComboId] === domain) return prev;
      return { ...prev, [bulkComboId]: domain };
    });
  }, [urlMode, bulkComboId, domain]);

  return {
    // State
    bulkUrls,
    setBulkUrls,
    bulkTemplates,
    setBulkTemplates,
    bulkActiveTemplateId,
    setBulkActiveTemplateId,
    bulkPreviewIndex,
    // Computed
    bulkCombos,
    currentBulkUrl,
    currentCombo,
    bulkComboId,
    bulkTotalCount,
    bulkComboCount,
    // Actions
    handleBulkPrev,
    handleBulkNext,
    // Data for submission
    bulkKeyByCombo,
    bulkDomainByCombo,
    resetBulkState,
  };
}
