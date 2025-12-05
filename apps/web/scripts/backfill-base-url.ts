import { normalizeUrl } from "@/lib/api/links/normalize-url";
import { prisma } from "@dub/prisma";
import "dotenv-flow/config";

async function main() {
  const batchSize = 1000;
  let processedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  console.log("Starting baseUrl backfill...");

  while (true) {
    // Fetch links that don't have baseUrl set yet
    const links = await prisma.link.findMany({
      where: {
        baseUrl: null,
      },
      select: {
        id: true,
        url: true,
      },
      take: batchSize,
    });

    if (links.length === 0) {
      console.log("No more links to process");
      break;
    }

    console.log(`Processing batch of ${links.length} links...`);

    const results = await Promise.allSettled(
      links.map((link) => {
        const baseUrl = normalizeUrl(link.url);
        
        return prisma.link.update({
          where: { id: link.id },
          data: {
            baseUrl,
          },
        });
      }),
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled").length;
    const rejected = results.filter((r) => r.status === "rejected").length;

    processedCount += links.length;
    updatedCount += fulfilled;
    errorCount += rejected;

    console.log(`Processed: ${processedCount} | Updated: ${updatedCount} | Errors: ${errorCount}`);

    // Log any errors
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`Error updating link ${links[index].id}:`, result.reason);
      }
    });
  }

  console.log("\n=== Backfill Complete ===");
  console.log(`Total processed: ${processedCount}`);
  console.log(`Successfully updated: ${updatedCount}`);
  console.log(`Errors: ${errorCount}`);
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
