import LoginForm from "@/ui/auth/login/login-form";
import { Logo } from "@dub/ui";
import { ClientOnly } from "@dub/ui";

export default function CbeLoginPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="flex flex-col items-center justify-center space-y-6">
        <Logo className="h-8" />
        <div className="w-full rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Extension Login
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to connect your browser extension
            </p>
          </div>
          <ClientOnly>
            <LoginForm 
              methods={["email", "password", "google"]} 
              next="/success"
            />
          </ClientOnly>
        </div>
      </div>
    </div>
  );
}
