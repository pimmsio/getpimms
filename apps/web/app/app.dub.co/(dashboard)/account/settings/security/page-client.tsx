"use client";

import useUser from "@/lib/swr/use-user";
import { RequestSetPassword } from "./request-set-password";
import { UpdatePassword } from "./update-password";

export const dynamic = "force-dynamic";

export default function SecurityPageClient() {
  const { loading, user } = useUser();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="border-b border-neutral-100 pb-3">
          <div className="h-4 w-24 rounded-full bg-neutral-100"></div>
          <div className="mt-2 h-3 w-56 rounded-full bg-neutral-100"></div>
        </div>
        <div className="flex flex-wrap justify-between gap-4">
          <div className="h-10 w-full max-w-sm rounded-lg bg-neutral-100"></div>
          <div className="h-10 w-full max-w-sm rounded-lg bg-neutral-100"></div>
        </div>
        <div className="h-9 w-40 rounded-lg bg-neutral-100"></div>
      </div>
    );
  }

  return <>{user?.hasPassword ? <UpdatePassword /> : <RequestSetPassword />}</>;
}
