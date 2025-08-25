import { withAdmin } from "@/lib/auth";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// GET /api/admin/tags/count – get tags count for admin
export const GET = withAdmin(async () => {
  const count = await prisma.tag.count();
  return NextResponse.json(count);
});
