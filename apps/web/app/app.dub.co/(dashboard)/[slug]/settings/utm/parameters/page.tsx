import { Suspense } from "react";
import WorkspaceUtmParametersClient from "../../library/parameters/page-client";

export default function WorkspaceUtmParameters() {
  return (
    <Suspense>
      <WorkspaceUtmParametersClient />
    </Suspense>
  );
}

