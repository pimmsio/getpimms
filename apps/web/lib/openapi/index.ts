import { openApiErrorResponses } from "@/lib/openapi/responses";
import { createDocument } from "zod-openapi";
import { analyticsPath } from "./analytics";
import { embedTokensPaths } from "./embed-tokens";
import { linksPaths } from "./links";
import { qrCodePaths } from "./qr";
import { trackPaths } from "./track";

export const document = createDocument({
  openapi: "3.0.3",
  info: {
    title: "Pimms API",
    description: "Pimms | Tracking beyond Clicks",
    version: "0.0.1",
    contact: {
      name: "Pimms Support",
      email: "alexandre@pimms.io",
      url: "https://pimms.io/api",
    },
    license: {
      name: "AGPL-3.0 license",
      url: "https://github.com/getpimms/pimms/blob/main/LICENSE.md",
    },
  },
  servers: [
    {
      url: "https://api.pimms.io",
      description: "Production API",
    },
  ],
  paths: {
    ...linksPaths,
    ...analyticsPath,
    // ...eventsPath,
    // ...tagsPaths,
    // ...foldersPaths,
    // ...domainsPaths,
    ...trackPaths,
    // ...customersPaths,
    // ...partnersPaths,
    // ...workspacesPaths,
    ...embedTokensPaths,
    ...qrCodePaths,
    // ...metatagsPath,
  },
  components: {
    // schemas: {
    //   LinkSchema,
    //   WorkspaceSchema,
    //   TagSchema,
    //   FolderSchema,
    //   DomainSchema,
    //   webhookEventSchema,
    //   LinkErrorSchema,
    // },
    securitySchemes: {
      token: {
        type: "http",
        description: "Default authentication mechanism",
        scheme: "bearer",
        "x-speakeasy-example": "PIMMS_API_KEY",
      },
    },
    responses: {
      ...openApiErrorResponses,
    },
  },
});
