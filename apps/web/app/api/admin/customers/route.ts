import { withAdmin } from "@/lib/auth";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// GET /api/admin/customers – get all customers for admin
export const GET = withAdmin(async ({ searchParams }) => {
  const { search, limit = "50" } = searchParams;
  
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : undefined,
    orderBy: [
      { name: "asc" },
      { email: "asc" },
    ],
    take: parseInt(limit),
  });

  return NextResponse.json(customers);
});
