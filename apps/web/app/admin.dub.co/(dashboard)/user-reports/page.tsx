import UserReportsTable from "./user-reports-table";
import LayoutLoader from "@/ui/layout/layout-loader";
import { Suspense } from "react";

export default function AdminUserReports() {
  return (
    <div className="min-h-screen w-full">
      <div className="sticky top-0 z-20 border-b border-neutral-100 bg-white/90 backdrop-blur-sm">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Workspace Reports
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Comprehensive workspace analytics with owner info, link counts, and click activity
          </p>
        </div>
      </div>
      <Suspense fallback={<LayoutLoader />}>
        <div className="w-full p-6">
          <UserReportsTable />
        </div>
      </Suspense>
    </div>
  );
}
