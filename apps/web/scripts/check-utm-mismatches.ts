import { prisma } from "@dub/prisma";
import { getParamsFromURL } from "@dub/utils";
import "dotenv-flow/config";

const BATCH_SIZE = 100;
const INITIAL_DELAY_MS = 100; // Initial delay between updates in milliseconds
const MAX_DELAY_MS = 5000; // Maximum delay cap
const UTM_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

/**
 * Normalize UTM values for comparison:
 * - Treat null, undefined, and empty string as equivalent (no value)
 * - Convert to lowercase for case-insensitive comparison
 */
function normalizeUtmValue(value: string | null | undefined): string | null {
  if (!value || value.trim() === "") {
    return null;
  }
  return value.trim().toLowerCase();
}

/**
 * Compare two UTM values and return true if they match
 */
function utmValuesMatch(
  urlValue: string | null | undefined,
  dbValue: string | null | undefined,
): boolean {
  const normalizedUrl = normalizeUtmValue(urlValue);
  const normalizedDb = normalizeUtmValue(dbValue);
  return normalizedUrl === normalizedDb;
}

async function main() {
  let offset = 0;
  let totalProcessed = 0;
  let totalMismatches = 0;
  let totalFixed = 0;
  let errorCount = 0;

  console.log("Starting UTM parameter mismatch check and fix...");
  console.log(`Processing links in batches of ${BATCH_SIZE}\n`);

  while (true) {
    try {
      console.log(`[DEBUG] Fetching batch at offset ${offset}...`);
      // Fetch batch of links
      const links = await prisma.link.findMany({
        select: {
          id: true,
          shortLink: true,
          url: true,
          utm_source: true,
          utm_medium: true,
          utm_campaign: true,
          utm_term: true,
          utm_content: true,
        },
        skip: offset,
        take: BATCH_SIZE,
        orderBy: {
          createdAt: "asc",
        },
      });

      // If no more links, break
      if (links.length === 0) {
        console.log("\nNo more links to process");
        break;
      }

      console.log(
        `Processing batch: ${offset + 1} to ${offset + links.length} (${links.length} links)...`,
      );

      // Process each link in the batch
      let linkIndex = 0;
      for (const link of links) {
        linkIndex++;
        console.log(`[DEBUG] Processing link ${linkIndex}/${links.length} in batch (ID: ${link.id})...`);
        try {
          console.log(`[DEBUG] Extracting UTM parameters from URL...`);
          // Extract UTM parameters from URL
          const urlParams = getParamsFromURL(link.url);
          console.log(`[DEBUG] Found ${Object.keys(urlParams).length} URL parameters`);

          // Get database UTM values
          const dbUtms = {
            utm_source: link.utm_source,
            utm_medium: link.utm_medium,
            utm_campaign: link.utm_campaign,
            utm_term: link.utm_term,
            utm_content: link.utm_content,
          };

          // Collect updates needed for this link
          const updates: Record<string, string | null> = {};
          let linkHasMismatches = false;

          // Check each UTM parameter for mismatches
          for (const param of UTM_PARAMS) {
            const urlValue = urlParams[param] || null;
            const dbValue = dbUtms[param] || null;

            // If values don't match, log the mismatch and prepare update
            if (!utmValuesMatch(urlValue, dbValue)) {
              const urlDisplay = urlValue ?? "null";
              const dbDisplay = dbValue ?? "null";

              console.log(
                `Mismatch found - Link ID: ${link.id} | ${param}: URL="${urlDisplay}" DB="${dbDisplay}"`,
              );
              totalMismatches++;
              linkHasMismatches = true;

              // Use the value from URL (or null if not present)
              updates[param] = urlValue;
            }
          }

          // Update database if there are mismatches
          if (linkHasMismatches && Object.keys(updates).length > 0) {
            // Exponential backoff: delay increases with each update
            const delay = Math.min(
              INITIAL_DELAY_MS * Math.pow(2, totalFixed),
              MAX_DELAY_MS,
            );
            if (totalFixed > 0) {
              console.log(`[DEBUG] Waiting ${delay}ms before update (exponential backoff)...`);
              await new Promise((resolve) => setTimeout(resolve, delay));
            }

            console.log(`[DEBUG] Updating database for link ${link.id}...`);
            await prisma.link.update({
              where: { id: link.id },
              data: updates,
            });
            console.log(`[DEBUG] Database update completed for link ${link.id}`);
            console.log(
              `Fixed - Link ID: ${link.id} | Updated: ${Object.keys(updates).join(", ")}`,
            );
            totalFixed++;
          } else {
            console.log(`[DEBUG] No updates needed for link ${link.id}`);
          }
        } catch (linkError) {
          // Log error for this link but continue processing
          console.error(
            `Error processing link ${link.id} (${link.shortLink}):`,
            linkError instanceof Error ? linkError.message : String(linkError),
          );
          errorCount++;
        }
      }

      totalProcessed += links.length;
      offset += links.length;
      console.log(`[DEBUG] Batch complete. Total processed: ${totalProcessed}, Total fixed: ${totalFixed}`);

      // If we got fewer links than batch size, we've reached the end
      if (links.length < BATCH_SIZE) {
        console.log(`[DEBUG] Reached end of links (got ${links.length} < ${BATCH_SIZE})`);
        break;
      }
    } catch (batchError) {
      console.error(`[ERROR] Error processing batch at offset ${offset}:`, batchError);
      errorCount++;
      // Continue to next batch
      offset += BATCH_SIZE;
    }
  }

  console.log("\n=== UTM Mismatch Check and Fix Complete ===");
  console.log(`Total links processed: ${totalProcessed}`);
  console.log(`Total mismatches found: ${totalMismatches}`);
  console.log(`Total mismatches fixed: ${totalFixed}`);
  console.log(`Errors encountered: ${errorCount}`);
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
