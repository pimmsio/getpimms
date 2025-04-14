import { openApiErrorResponses } from "@/lib/openapi/responses";
import { DomainSchema } from "@/lib/zod/schemas/domains";
import { LinkErrorSchema, LinkSchema } from "@/lib/zod/schemas/links";
import { TagSchema } from "@/lib/zod/schemas/tags";
import { WorkspaceSchema } from "@/lib/zod/schemas/workspaces";
import { createDocument } from "zod-openapi";
import { webhookEventSchema } from "../webhook/schemas";
import { FolderSchema } from "../zod/schemas/folders";
import { analyticsPath } from "./analytics";
import { customersPaths } from "./customers";
import { domainsPaths } from "./domains";
import { embedTokensPaths } from "./embed-tokens";
import { eventsPath } from "./events";
import { foldersPaths } from "./folders";
import { linksPaths } from "./links";
import { metatagsPath } from "./metatags";
import { partnersPaths } from "./partners";
import { qrCodePaths } from "./qr";
import { tagsPaths } from "./tags";
import { trackPaths } from "./track";
import { workspacesPaths } from "./workspaces";

export const document = createDocument({
  openapi: "3.0.3",
  info: {
    title: "PIMMS API",
    description:
      "PIMMS | Grow with deeplinks",
    version: "0.0.1",
    contact: {
      name: "PIMMS Support",
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
