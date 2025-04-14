import { prisma } from "@dub/prisma";
import "dotenv-flow/config";

async function main() {
  const domains = await prisma.domain.updateMany({
    where: {
      placeholder: "https://pimms.io/blog/what-is-pimms",
    },
    data: {
      placeholder: null,
    },
  });

  console.log(domains);
}

main();
