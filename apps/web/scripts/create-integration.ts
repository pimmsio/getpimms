import { prisma } from "@dub/prisma";
import { DUB_WORKSPACE_ID } from "@dub/utils";
import "dotenv-flow/config";

async function main() {
  const integration = await prisma.integration.create({
    data: {
      name: "Slack",
      slug: "slack",
      description: "Create links from Slack messages easily with PIMMS.",
      developer: "PIMMS",
      website: "https://pimms.io",
      verified: true,
      projectId: DUB_WORKSPACE_ID,

      // screenshots: [],
      // userId: "",
      // logo: "",
      // readme: "",
    },
  });

  console.log(`${integration.name} integration created`, integration);
}

main();
