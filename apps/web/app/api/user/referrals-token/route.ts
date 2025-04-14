import { withSession } from "@/lib/auth";
import { APP_DOMAIN } from "@dub/utils";
import { NextResponse } from "next/server";

export const GET = withSession(async ({ session }) => {

  // rest api instead
  const response = await fetch(`${APP_DOMAIN}/api/tokens/embed/referrals`, {
    method: "POST",
    body: JSON.stringify({
      programId: process.env.PIMMS_PROGRAM_ID!,
      tenantId: session.user.id,
      partner: {
        name: session.user.name || session.user.email,
        email: session.user.email,
        image: session.user.image || null,
        tenantId: session.user.id,
      },
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PIMMS_API_KEY}`,
    },
  });

  const data = await response.json();
  return NextResponse.json({ publicToken: data.publicToken });
});
