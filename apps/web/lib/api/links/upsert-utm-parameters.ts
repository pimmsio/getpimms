import { prisma } from "@dub/prisma";
import { createId } from "../create-id";

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
  const promises: Promise<any>[] = [];

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

  // Execute all upserts in parallel
  await Promise.allSettled(promises);
}

