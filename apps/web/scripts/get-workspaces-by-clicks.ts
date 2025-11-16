import { prisma } from "@dub/prisma";
import "dotenv-flow/config";

async function main() {
  const workspaces = await prisma.project.findMany({
    select: {
      slug: true,
      plan: true,
      eventsUsage: true,
      _count: {
        select: {
          domains: true,
        },
      },
    },
    orderBy: {
      eventsUsage: "desc",
    },
    take: 100,
  });
  console.table(workspaces, ["slug", "plan", "eventsUsage", "_count"]);
}

main();
