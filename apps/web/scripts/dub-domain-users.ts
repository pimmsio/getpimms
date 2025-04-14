import { prisma } from "@dub/prisma";
import "dotenv-flow/config";

async function main() {
  const users = await prisma.link.groupBy({
    by: ["userId"],
    where: {
      domain: "pim.ms",
    },
    _count: {
      userId: true,
    },
    orderBy: {
      _count: {
        userId: "desc",
      },
    },
    take: 100,
  });
  console.table(users);
}

main();
