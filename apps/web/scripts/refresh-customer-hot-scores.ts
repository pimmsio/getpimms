#!/usr/bin/env tsx

/**
 * Script to refresh all customer hot scores using the updated algorithm
 * Run this after algorithm updates to ensure all customers have accurate scores
 */

import { computeCustomerHotScore } from "@/lib/analytics/compute-customer-hot-score";
import { prisma } from "@dub/prisma";

async function refreshCustomerHotScores(workspaceId?: string) {
  console.log("🔥 Refreshing customer hot scores...");
  
  const whereClause = workspaceId ? { projectId: workspaceId } : {};
  
  // Get all customers
  const customers = await prisma.customer.findMany({
    where: whereClause,
    select: {
      id: true,
      projectId: true,
      lastEventAt: true,
      hotScore: true,
      lastHotScoreAt: true,
    },
  });

  console.log(`Found ${customers.length} customers to process`);
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const customer of customers) {
    try {
      // Check if customer was already computed today (respecting once-per-day rule)
      if (customer.lastHotScoreAt && new Date(customer.lastHotScoreAt) > oneDayAgo) {
        console.log(`⏭️  Skipping customer ${customer.id}: already computed today (${customer.lastHotScoreAt})`);
        skipped++;
        continue;
      }

      // Compute new hot score
      const newHotScore = await computeCustomerHotScore(
        customer.id,
        customer.projectId,
      );
      
      // Always update to record that we computed today
      await prisma.customer.update({
        where: { id: customer.id },
        data: { 
          hotScore: newHotScore,
          lastHotScoreAt: new Date(),
        },
      });
      
      console.log(`✅ Updated customer ${customer.id}: ${customer.hotScore} → ${newHotScore}`);
      updated++;
    } catch (error) {
      console.error(`❌ Error updating customer ${customer.id}:`, error);
      errors++;
    }
  }
  
  console.log(`\n🎯 Results:`);
  console.log(`- Updated: ${updated} customers`);
  console.log(`- Skipped (computed today): ${skipped} customers`);
  console.log(`- Errors: ${errors} customers`);
}

// Run the script
if (require.main === module) {
  const workspaceId = process.argv[2]; // Optional workspace ID argument
  
  refreshCustomerHotScores(workspaceId)
    .then(() => {
      console.log("✅ Hot score refresh completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Hot score refresh failed:", error);
      process.exit(1);
    });
}

export { refreshCustomerHotScores };
