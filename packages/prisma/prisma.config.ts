import { defineConfig } from "prisma/config";

export default defineConfig({
  // Schema is split across multiple `.prisma` files in `./schema/`
  // (Prisma supports schema folders without the deprecated `prismaSchemaFolder` preview flag).
  schema: "./schema",
});


