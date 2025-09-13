import { RegisterProvider } from "@/ui/auth/register/context";
import { SignUpForm } from "@/ui/auth/register/signup-form";
import { Logo } from "@dub/ui";
import { ClientOnly } from "@dub/ui";
import Link from "next/link";

export default function CbeRegisterPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="flex flex-col items-center justify-center space-y-6">
        <Logo className="h-8" />
        <div className="w-full rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Create Extension Account
            </h1>
            <p className="mt-2 text-sm">
              Create your account to use the browser extension
            </p>
          </div>
          <ClientOnly>
            <RegisterProvider>
              <SignUpForm methods={["email", "google"]} />
            </RegisterProvider>
          </ClientOnly>
          <div className="mt-6 text-center">
            <p className="text-sm">
              Already have an account?{" "}
              <Link 
                href="/login" 
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
