import { Logo } from "@dub/ui";
import Link from "next/link";

export default function CbePage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="flex flex-col items-center justify-center space-y-6">
        <Logo className="h-8" />
        <div className="w-full rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-lg text-center">
          <div className="mb-6">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-3xl">🔌</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">
              PIMMS Extension Portal
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Connect your browser extension to your PIMMS account
            </p>
          </div>
          
          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Account
            </Link>
          </div>
          
          <p className="mt-6 text-xs text-gray-500">
            This portal is specifically designed for browser extension authentication.
          </p>
        </div>
      </div>
    </div>
  );
}
