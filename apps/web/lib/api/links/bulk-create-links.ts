import { ProcessedLinkProps } from "@/lib/types";
import { prisma } from "@dub/prisma";
import { getParamsFromURL, linkConstructorSimple, truncate } from "@dub/utils";
import { Prisma } from "@prisma/client";
import { waitUntil } from "@vercel/functions";
import { createId } from "../create-id";
import { combineTagIds } from "../tags/combine-tag-ids";
import { encodeKeyIfCaseSensitive } from "./case-sensitivity";
import { includeTags } from "./include-tags";
import { normalizeUrl } from "./normalize-url";
import { propagateBulkLinkChanges } from "./propagate-bulk-link-changes";
import { updateLinksUsage } from "./update-links-usage";
import { upsertUtmParameters } from "./upsert-utm-parameters";
import {
  checkIfLinksHaveTags,
  checkIfLinksHaveWebhooks,
  transformLink,
} from "./utils";

export async function bulkCreateLinks({
  links,
  skipRedisCache = false,
}: {
  links: ProcessedLinkProps[];
  skipRedisCache?: boolean;
}) {
  if (links.length === 0) return [];

  const hasTags = checkIfLinksHaveTags(links);
  const hasWebhooks = checkIfLinksHaveWebhooks(links);

  // Create a map of shortLinks to their original indices at the start
  const shortLinkToIndexMap = new Map(
    links.map((link, index) => {
      const key = encodeKeyIfCaseSensitive({
        domain: link.domain,
        key: link.key,
      });

      return [
        linkConstructorSimple({
          domain: link.domain,
          key,
        }),
        index,
      ];
    }),
  );

  // Create all links first using createMany
  await prisma.link.createMany({
    data: links.map(({ tagId, tagIds, tagNames, webhookIds, ...link }) => {
      // Use UTM values from form fields (not from URL)
      const { utm_source, utm_medium, utm_campaign, utm_term, utm_content } = link;

      link.key = encodeKeyIfCaseSensitive({
        domain: link.domain,
        key: link.key,
      });

      return {
        ...link,
        id: createId({ prefix: "link_" }),
        shortLink: linkConstructorSimple({
          domain: link.domain,
          key: link.key,
        }),
        title: truncate(link.title, 120),
        description: truncate(link.description, 240),
        baseUrl: normalizeUrl(link.url),
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        expiresAt: link.expiresAt ? new Date(link.expiresAt) : null,
        geo: link.geo || undefined,
        testVariants: link.testVariants || Prisma.JsonNull,
      };
    }),
    skipDuplicates: true,
  });

  // Fetch the created links to get their IDs
  let createdLinksData = await prisma.link.findMany({
    where: {
      shortLink: {
        in: Array.from(shortLinkToIndexMap.keys()),
      },
    },
  });

  if (hasTags || hasWebhooks) {
    // Create tags and webhooks in parallel if needed
    const createRelationsPromises: Promise<any>[] = [];

    if (hasTags) {
      const linkTagsToCreate: {
        linkId: string;
        tagId: string;
        createdAt: Date;
      }[] = [];

      let tagNameToIdMap: Record<string, string> = {};

      if (links.some((link) => link.tagNames?.length)) {
        const allTagNames = [
          ...new Set(links.flatMap((link) => link.tagNames).filter(Boolean)),
        ] as string[];

        const allTagIds = await prisma.tag.findMany({
          where: {
            projectId: links[0].projectId!,
            name: {
              in: allTagNames,
            },
          },
        });

        tagNameToIdMap = allTagIds.reduce(
          (acc, tag) => {
            acc[tag.name.toLowerCase()] = tag.id;
            return acc;
          },
          {} as Record<string, string>,
        );
      }

      createdLinksData.forEach((link, idx) => {
        const originalLink = links[idx];
        if (!originalLink) return;

        const { tagId, tagIds, tagNames } = originalLink;
        const combinedTagIds = combineTagIds({ tagId, tagIds });

        // Handle tag creation by IDs
        if (combinedTagIds && combinedTagIds.length > 0) {
          combinedTagIds.filter(Boolean).forEach((tagId, tagIdx) => {
            linkTagsToCreate.push({
              linkId: link.id,
              tagId,
              createdAt: new Date(new Date().getTime() + tagIdx * 100),
            });
          });
        }

        if (tagNames && tagNames.length > 0) {
          tagNames.filter(Boolean).forEach((tagName, tagIdx) => {
            linkTagsToCreate.push({
              linkId: link.id,
              tagId: tagNameToIdMap[tagName.toLowerCase()],
              createdAt: new Date(new Date().getTime() + tagIdx * 100),
            });
          });
        }
      });

      if (linkTagsToCreate.length > 0) {
        createRelationsPromises.push(
          prisma.linkTag.createMany({
            data: linkTagsToCreate,
            skipDuplicates: true,
          }),
        );
      }
    }

    if (hasWebhooks) {
      const linkWebhooksToCreate: { linkId: string; webhookId: string }[] = [];

      createdLinksData.forEach((link, idx) => {
        const originalLink = links[idx];
        if (!originalLink?.webhookIds?.length) return;

        originalLink.webhookIds.forEach((webhookId) => {
          linkWebhooksToCreate.push({
            linkId: link.id,
            webhookId,
          });
        });
      });

      if (linkWebhooksToCreate.length > 0) {
        createRelationsPromises.push(
          prisma.linkWebhook.createMany({
            data: linkWebhooksToCreate,
            skipDuplicates: true,
          }),
        );
      }
    }

    // Wait for all relations to be created
    if (createRelationsPromises.length > 0) {
      await Promise.all(createRelationsPromises);
    }

    // Refetch the links with their relations to return the complete data
    createdLinksData = await prisma.link.findMany({
      where: {
        id: {
          in: createdLinksData.map((link) => link.id),
        },
      },
      include: {
        ...includeTags,
        webhooks: hasWebhooks
          ? {
              select: {
                webhookId: true,
              },
            }
          : false,
      },
    });
  }

  // Collect all unique UTM parameters from links
  const allUtmParams = links.reduce(
    (acc, link) => {
      if (link.utm_source) acc.sources.add(link.utm_source);
      if (link.utm_medium) acc.mediums.add(link.utm_medium);
      if (link.utm_campaign) acc.campaigns.add(link.utm_campaign);
      if (link.utm_term) acc.terms.add(link.utm_term);
      if (link.utm_content) acc.contents.add(link.utm_content);
      return acc;
    },
    {
      sources: new Set<string>(),
      mediums: new Set<string>(),
      campaigns: new Set<string>(),
      terms: new Set<string>(),
      contents: new Set<string>(),
    },
  );

  waitUntil(
    Promise.all([
      propagateBulkLinkChanges({
        links: createdLinksData,
        skipRedisCache,
      }),
      updateLinksUsage({
        workspaceId: links[0].projectId!, // this will always be present
        increment: links.length,
      }),
      // Upsert unique UTM parameters to the library
      ...Array.from(allUtmParams.sources).map((utm_source) =>
        upsertUtmParameters({
          projectId: links[0].projectId!,
          utm_source,
          utm_medium: null,
          utm_campaign: null,
          utm_term: null,
          utm_content: null,
        }),
      ),
      ...Array.from(allUtmParams.mediums).map((utm_medium) =>
        upsertUtmParameters({
          projectId: links[0].projectId!,
          utm_source: null,
          utm_medium,
          utm_campaign: null,
          utm_term: null,
          utm_content: null,
        }),
      ),
      ...Array.from(allUtmParams.campaigns).map((utm_campaign) =>
        upsertUtmParameters({
          projectId: links[0].projectId!,
          utm_source: null,
          utm_medium: null,
          utm_campaign,
          utm_term: null,
          utm_content: null,
        }),
      ),
      ...Array.from(allUtmParams.terms).map((utm_term) =>
        upsertUtmParameters({
          projectId: links[0].projectId!,
          utm_source: null,
          utm_medium: null,
          utm_campaign: null,
          utm_term,
          utm_content: null,
        }),
      ),
      ...Array.from(allUtmParams.contents).map((utm_content) =>
        upsertUtmParameters({
          projectId: links[0].projectId!,
          utm_source: null,
          utm_medium: null,
          utm_campaign: null,
          utm_term: null,
          utm_content,
        }),
      ),
    ]),
  );

  // Simplified sorting using the map
  createdLinksData = createdLinksData.sort((a, b) => {
    const aIndex = shortLinkToIndexMap.get(a.shortLink) ?? -1;
    const bIndex = shortLinkToIndexMap.get(b.shortLink) ?? -1;
    return aIndex - bIndex;
  });

  return createdLinksData.map((link) => transformLink(link));
}
