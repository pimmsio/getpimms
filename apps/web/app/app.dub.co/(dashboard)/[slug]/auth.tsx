import LayoutLoader from "@/ui/layout/layout-loader";
import dynamic from "next/dynamic";
import { ReactNode } from "react";

const WorkspaceAuthClient = dynamic<{ children: ReactNode }>(
  () => import("./auth-client.tsx"),
  {
    ssr: false,
    loading: () => <LayoutLoader />,
  },
);

export default function WorkspaceAuth({ children }: { children: ReactNode }) {
  return <WorkspaceAuthClient>{children}</WorkspaceAuthClient>;
}
