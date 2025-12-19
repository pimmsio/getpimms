import { UserProps } from "@/lib/types";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { prismaEdge } from "@dub/prisma/edge";

export async function getUserViaToken(req: NextRequest) {
  const session = (await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })) as {
    email?: string;
    user?: UserProps;
  };

  const user = session?.user;
  if (!user?.id) {
    return user;
  }

  const missingCreatedAt = !(user as any)?.createdAt;
  const missingDefaultWorkspace = !(user as any)?.defaultWorkspace;

  // Only hydrate if we are missing fields that our middleware relies on.
  if (missingCreatedAt || missingDefaultWorkspace) {
    const refreshed = await prismaEdge.user.findUnique({
      where: { id: user.id },
      select: {
        createdAt: true,
        defaultWorkspace: true,
      },
    });

    return {
      ...user,
      ...(missingCreatedAt ? { createdAt: refreshed?.createdAt } : {}),
      ...(missingDefaultWorkspace
        ? { defaultWorkspace: refreshed?.defaultWorkspace }
        : {}),
    } as UserProps;
  }

  return user;
}
