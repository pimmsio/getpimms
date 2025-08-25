import { constructMetadata } from "@dub/utils";
import BanLink from "./components/ban-link";
import ImpersonateUser from "./components/impersonate-user";
import ImpersonateWorkspace from "./components/impersonate-workspace";
import RefreshDomain from "./components/refresh-domain";

export const metadata = constructMetadata({
  title: "PIMMS Admin",
});

export default function AdminPage() {
  return (
    <div className="min-h-screen w-full">
      <div className="sticky top-0 z-20 border-b border-neutral-100 bg-white/90 backdrop-blur-sm">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Admin Dashboard
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Manage system settings and user operations
          </p>
        </div>
      </div>
      <div className="p-6">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-xl font-semibold mb-2">Impersonate User</h2>
              <p className="text-sm text-neutral-500 mb-4">Get a login link for a user</p>
              <ImpersonateUser />
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-xl font-semibold mb-2">Impersonate Workspace</h2>
              <p className="text-sm text-neutral-500 mb-4">
                Get a login link for the owner of a workspace
              </p>
              <ImpersonateWorkspace />
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-xl font-semibold mb-2">Refresh Domain</h2>
              <p className="text-sm text-neutral-500 mb-4">
                Remove and re-add domain from Vercel
              </p>
              <RefreshDomain />
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-xl font-semibold mb-2">Ban Link</h2>
              <p className="text-sm text-neutral-500 mb-4">Ban a pim.ms link</p>
              <BanLink />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
