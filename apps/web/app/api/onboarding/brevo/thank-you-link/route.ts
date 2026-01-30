import { withWorkspace } from "@/lib/auth";
import {
  deleteStoredThankYouLink,
  getStoredThankYouLink,
  setStoredThankYouLink,
  thankYouLinkBodySchema,
} from "@/lib/onboarding/thank-you-link-store";
import { NextResponse } from "next/server";

const providerKey = "brevo";

// GET /api/onboarding/brevo/thank-you-link
export const GET = withWorkspace(async ({ workspace }) => {
  const stored = await getStoredThankYouLink({
    workspaceId: workspace.id,
    providerKey,
  });
  return NextResponse.json({ thankYou: stored ?? null });
});

// POST /api/onboarding/brevo/thank-you-link
export const POST = withWorkspace(async ({ req, workspace }) => {
  const body = thankYouLinkBodySchema.parse(await req.json().catch(() => null));
  const value = await setStoredThankYouLink({
    workspaceId: workspace.id,
    providerKey,
    body,
  });
  return NextResponse.json({ thankYou: value });
});

// DELETE /api/onboarding/brevo/thank-you-link
export const DELETE = withWorkspace(async ({ workspace }) => {
  await deleteStoredThankYouLink({
    workspaceId: workspace.id,
    providerKey,
  });
  return NextResponse.json({ ok: true });
});

