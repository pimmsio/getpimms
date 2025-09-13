import { ClientOnly } from "@dub/ui";
import { Suspense } from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="w-screen sm:w-full min-h-screen bg-[#fafafa] relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute left-0 top-0 aspect-square w-full overflow-hidden sm:aspect-[2/1] opacity-40"
          style={{
            maskImage: "radial-gradient(70% 100% at 50% 0%, black 70%, transparent)"
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `conic-gradient(from -45deg at 50% -10%, #3970ff 0deg, #2fcdfa 120deg, #3970ff 240deg, #2fcdfa 360deg)`,
            }}
          />
          <div className="absolute inset-0 backdrop-blur-[120px]" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10 grid w-full grid-cols-1 lg:grid-cols-2 min-h-screen">
        <div className="hidden lg:flex flex-col justify-center p-12 relative">
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-gray-900 leading-tight font-jakarta">
                  Turn More Clicks into Sales
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed max-w-md">
                  For creators, growth experts, and marketing teams aiming to collect 1000+ leads weekly, book more meetings, and grow revenue.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-screen px-4 py-6 lg:p-6">
          <div className="w-full lg:max-w-md">
            <ClientOnly className="relative flex w-full flex-col items-center justify-center">
              <Suspense>{children}</Suspense>
            </ClientOnly>
          </div>
        </div>
      </div>

      <div className="hidden lg:block absolute bottom-6 left-12 text-xs text-gray-500">
        <p className="mb-2">© {new Date().getFullYear()} PIMMS.</p>
        <div className="flex gap-4 text-gray-400">
          <a href="https://pimms.io/legal/privacy" target="_blank" className="hover:text-gray-600 transition-colors">
            Privacy Policy
          </a>
          <a href="https://pimms.io/legal/terms" target="_blank" className="hover:text-gray-600 transition-colors">
            Terms of Service
          </a>
          <a href="https://github.com/getpimms/pim-ms" target="_blank" className="hover:text-gray-600 transition-colors">
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
};
