import { prisma } from "@dub/prisma";
import { getCurrentPlan, INFINITY_NUMBER } from "@dub/utils";
import { createId } from "../create-id";
import { getUtmParameterLibraryCount } from "@/lib/utm/limits";

/**
 * Upsert UTM parameters to their respective tables
 * This ensures that UTM values used in links are available in the library for reuse
 */
export async function upsertUtmParameters({
  projectId,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_term,
  utm_content,
}: {
  projectId: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
}): Promise<void> {
  const workspace = await prisma.project.findUnique({
    where: { id: projectId },
    select: { plan: true },
  });

  // If workspace doesn't exist (shouldn't happen), bail out quietly.
  if (!workspace) return;

  const plan = getCurrentPlan(workspace.plan ?? "free");
  const parameterLimit = plan.limits.utmParameters ?? INFINITY_NUMBER;

  const promises: Promise<any>[] = [];

  // Fast path: unlimited (or no limit configured) => keep existing behavior.
  if (parameterLimit >= INFINITY_NUMBER) {
    // Upsert UTM Source
    if (utm_source) {
      promises.push(
        prisma.utmSource.upsert({
          where: {
            name_projectId: {
              name: utm_source,
              projectId,
            },
          },
          create: {
            id: createId({ prefix: "utm_src_" }),
            name: utm_source,
            projectId,
          },
          update: {},
        }),
      );
    }

    // Upsert UTM Medium
    if (utm_medium) {
      promises.push(
        prisma.utmMedium.upsert({
          where: {
            name_projectId: {
              name: utm_medium,
              projectId,
            },
          },
          create: {
            id: createId({ prefix: "utm_med_" }),
            name: utm_medium,
            projectId,
          },
          update: {},
        }),
      );
    }

    // Upsert UTM Campaign
    if (utm_campaign) {
      promises.push(
        prisma.utmCampaign.upsert({
          where: {
            name_projectId: {
              name: utm_campaign,
              projectId,
            },
          },
          create: {
            id: createId({ prefix: "utm_cmp_" }),
            name: utm_campaign,
            projectId,
          },
          update: {},
        }),
      );
    }

    // Upsert UTM Term
    if (utm_term) {
      promises.push(
        prisma.utmTerm.upsert({
          where: {
            name_projectId: {
              name: utm_term,
              projectId,
            },
          },
          create: {
            id: createId({ prefix: "utm_trm_" }),
            name: utm_term,
            projectId,
          },
          update: {},
        }),
      );
    }

    // Upsert UTM Content
    if (utm_content) {
      promises.push(
        prisma.utmContent.upsert({
          where: {
            name_projectId: {
              name: utm_content,
              projectId,
            },
          },
          create: {
            id: createId({ prefix: "utm_cnt_" }),
            name: utm_content,
            projectId,
          },
          update: {},
        }),
      );
    }

    await Promise.allSettled(promises);
    return;
  }

  // Limited: Only create NEW library values when we still have capacity.
  // Existing values are always fine (they don't increase count).
  const candidates = [
    {
      value: utm_source,
      exists: () =>
        prisma.utmSource.findUnique({
          where: { name_projectId: { name: utm_source!, projectId } },
          select: { id: true },
        }),
      create: () =>
        prisma.utmSource.create({
          data: { id: createId({ prefix: "utm_src_" }), name: utm_source!, projectId },
        }),
    },
    {
      value: utm_medium,
      exists: () =>
        prisma.utmMedium.findUnique({
          where: { name_projectId: { name: utm_medium!, projectId } },
          select: { id: true },
        }),
      create: () =>
        prisma.utmMedium.create({
          data: { id: createId({ prefix: "utm_med_" }), name: utm_medium!, projectId },
        }),
    },
    {
      value: utm_campaign,
      exists: () =>
        prisma.utmCampaign.findUnique({
          where: { name_projectId: { name: utm_campaign!, projectId } },
          select: { id: true },
        }),
      create: () =>
        prisma.utmCampaign.create({
          data: { id: createId({ prefix: "utm_cmp_" }), name: utm_campaign!, projectId },
        }),
    },
    {
      value: utm_term,
      exists: () =>
        prisma.utmTerm.findUnique({
          where: { name_projectId: { name: utm_term!, projectId } },
          select: { id: true },
        }),
      create: () =>
        prisma.utmTerm.create({
          data: { id: createId({ prefix: "utm_trm_" }), name: utm_term!, projectId },
        }),
    },
    {
      value: utm_content,
      exists: () =>
        prisma.utmContent.findUnique({
          where: { name_projectId: { name: utm_content!, projectId } },
          select: { id: true },
        }),
      create: () =>
        prisma.utmContent.create({
          data: { id: createId({ prefix: "utm_cnt_" }), name: utm_content!, projectId },
        }),
    },
  ].filter((c) => Boolean(c.value));

  if (candidates.length === 0) return;

  const existence = await Promise.allSettled(candidates.map((c) => c.exists()));
  const toCreate = candidates.filter((_, idx) => {
    const res = existence[idx];
    return res.status === "fulfilled" ? !res.value : true;
  });

  if (toCreate.length === 0) return;

  const currentTotal = await getUtmParameterLibraryCount(projectId);
  const remaining = Math.max(0, parameterLimit - currentTotal);
  if (remaining <= 0) return;

  await Promise.allSettled(toCreate.slice(0, remaining).map((c) => c.create()));
  return;
}

