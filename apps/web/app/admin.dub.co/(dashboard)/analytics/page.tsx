import Analytics from "@/ui/analytics";
import LayoutLoader from "@/ui/layout/layout-loader";
import { Suspense } from "react";

export default function AdminAnalytics() {
  return (
    <div className="min-h-screen w-full">
      <div className="sticky top-0 z-20 border-b border-neutral-100 bg-white/90 backdrop-blur-sm">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Monitor link performance and traffic analytics
          </p>
        </div>
      </div>
      <Suspense fallback={<LayoutLoader />}>
        <div className="w-full">
          <Analytics adminPage />
        </div>
      </Suspense>
    </div>
  );
}
