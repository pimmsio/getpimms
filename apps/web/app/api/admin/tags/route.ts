import { withAdmin } from "@/lib/auth";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// GET /api/admin/tags – get all tags for admin
export const GET = withAdmin(async ({ searchParams }) => {
  const { search, limit = "100" } = searchParams;
  
  const tags = await prisma.tag.findMany({
    select: {
      id: true,
      name: true,
      color: true,
      _count: {
        select: {
          links: true,
        },
      },
    },
    where: search
      ? {
          name: { contains: search },
        }
      : undefined,
    orderBy: [
      { name: "asc" },
    ],
    take: parseInt(limit),
  });

  // Transform to match expected format
  const formattedTags = tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    count: tag._count.links,
  }));

  return NextResponse.json(formattedTags);
});
