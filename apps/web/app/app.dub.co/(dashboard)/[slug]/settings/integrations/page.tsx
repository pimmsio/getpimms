import { IntegrationsList } from "./integrations-list";
import { cn } from "@dub/utils";
import { text } from "@/ui/design/tokens";

export const revalidate = 300; // 5 minutes

export default function IntegrationsPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <div className={text.pageTitle}>Integrations</div>
        <p className={cn("mb-2 mt-2", text.pageDescription)}>
          Use PIMMS with your existing favorite tools with our seamless
          integrations.
        </p>
      </div>
      <IntegrationsList />
    </div>
  );
}
