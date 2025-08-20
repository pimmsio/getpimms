import Insights from "app/app.dub.co/(dashboard)/[slug]/insights/insights";
import LayoutLoader from "@/ui/layout/layout-loader";
import { Suspense } from "react";

export default function AdminLinksReport() {
  return (
    <div className="min-h-screen w-full">
      <div className="sticky top-0 z-20 border-b border-neutral-100 bg-white/90 backdrop-blur-sm">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Links Report
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Detailed analytics and insights for all links across workspaces
          </p>
        </div>
      </div>
      <Suspense fallback={<LayoutLoader />}>
        <div className="w-full">
          <Insights adminPage />
        </div>
      </Suspense>
    </div>
  );
}
