import { pimms } from "@/lib/pimms";
import "dotenv-flow/config";

async function main() {
  const data = await pimms.analytics.retrieve({
    event: "clicks",
    groupBy: "triggers",
    interval: "30d",
  });
  console.log({ data });
}

main();
