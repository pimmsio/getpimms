import { Suspense } from "react";
import WorkspaceUtmParametersClient from "./page-client";

export default function WorkspaceUtmParameters() {
  return (
    <Suspense>
      <WorkspaceUtmParametersClient />
    </Suspense>
  );
}

