import { Logo } from "@dub/ui";
import { Suspense } from "react";
import CbeSuccessContent from "./success-content";

// Force this page to be client-side only to avoid SSR issues with useSession
export const dynamic = "force-dynamic";

export default function CbeSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-md">
          <div className="flex flex-col items-center justify-center space-y-6">
            <Logo className="h-8" />
            <div className="w-full rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-lg">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <CbeSuccessContent />
    </Suspense>
  );
}
