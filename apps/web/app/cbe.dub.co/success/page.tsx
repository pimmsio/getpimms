import dynamicImport from 'next/dynamic';
import { Suspense } from 'react';
import { Logo } from "@dub/ui";

// Force this page to be client-side only to avoid SSR issues with useSession
export const dynamic = 'force-dynamic';

// Dynamic import to avoid SSR issues
const CbeSuccessContent = dynamicImport(() => import('./success-content'), {
  ssr: false,
  loading: () => (
    <div className="mx-auto w-full max-w-md">
      <div className="flex flex-col items-center justify-center space-y-6">
        <Logo className="h-8" />
        <div className="w-full rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    </div>
  )
});

export default function CbeSuccessPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col items-center justify-center space-y-6">
          <Logo className="h-8" />
          <div className="w-full rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-lg text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <CbeSuccessContent />
    </Suspense>
  );
}