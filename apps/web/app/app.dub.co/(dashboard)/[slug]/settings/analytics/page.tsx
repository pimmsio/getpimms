import { AllowedHostnames } from "./allowed-hostnames";

export default function WorkspaceAnalytics() {
  return (
    <div className="flex h-full flex-col gap-10">
      <AllowedHostnames />
      <div className="rounded border border-neutral-200 bg-white p-5">
        <div className="text-pretty font-medium text-neutral-900">
          Conversion tracking is enabled by default
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          New links always collect signals. Connect your source (website script, Stripe, Zapier/Make, webhook) to reveal who’s clicking.
        </p>
      </div>
    </div>
  );
}
