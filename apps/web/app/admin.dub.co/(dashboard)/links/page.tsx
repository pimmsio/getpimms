import AdminLinksClient from "./page-client";
import { Suspense } from "react";
import LayoutLoader from "@/ui/layout/layout-loader";

export default function AdminLinks() {
  return (
    <div className="min-h-screen w-full">
      <div className="sticky top-0 z-20 border-b border-neutral-100 bg-white/90 backdrop-blur-sm">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Links Management
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            View and manage all links across workspaces
          </p>
        </div>
      </div>
      <Suspense fallback={<LayoutLoader />}>
        <AdminLinksClient />
      </Suspense>
    </div>
  );
}
