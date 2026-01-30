"use client";

/**
 * Canonical provider IDs for onboarding selections.
 *
 * Goal:
 * - Selecting the same provider in multiple categories should store ONE ID.
 * - Rendering onboarding setup tasks should show ONE entry per provider.
 *
 * Keep this explicit and tiny (no heuristics).
 */

export const CANONICAL_PROVIDER_ID: Record<string, string> = {
  // Brevo (forms + meetings)
  brevoMeeting: "brevo",
  brevoForm: "brevo",
  brevo: "brevo",

  // Podia (website + payments)
  podiaWebsite: "podia",
  podia: "podia",

  // Systeme.io (website + forms + payments)
  systemeioWebsite: "systemeio",
  systemeioForm: "systemeio",
  systemeio: "systemeio",

  // Shopify (website + payments) — currently excluded, but keep safe
  shopifyPayments: "shopify",
  shopify: "shopify",
};

export function canonicalizeProviderId(id: string) {
  if (String(id).startsWith("other")) return id;
  return CANONICAL_PROVIDER_ID[id] ?? id;
}

export function canonicalizeProviderIds(ids: string[]) {
  return Array.from(new Set((ids || []).map(canonicalizeProviderId)));
}

export function isProviderCompleted(providerId: string, completedProviderIds: string[]) {
  const canonical = canonicalizeProviderId(providerId);
  return (completedProviderIds || []).some(
    (id) => canonicalizeProviderId(id) === canonical,
  );
}

