import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    // Get the NextAuth session cookie from the request
    const sessionCookie = req.cookies.get('next-auth.session-token') || req.cookies.get('__Secure-next-auth.session-token');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: "No session cookie found" }, { status: 401 });
    }
    
    // Parse domain using the same logic as middleware
    let host = req.headers.get("host") as string;
    // remove www. from domain and convert to lowercase
    host = host.replace(/^www./, "").toLowerCase();
    
    let cookieDomain: string;
    if (host.includes("localhost")) {
      // for other localhost scenarios
      cookieDomain = ".localhost";
    } else {
      // for production/staging, extract the root domain
      cookieDomain = `.${host.split('.').slice(-2).join('.')}`;
    }
    
    return NextResponse.json({
      sessionCookie: {
        name: sessionCookie.name,
        value: sessionCookie.value,
        domain: cookieDomain,
        path: "/",
        httpOnly: false, // Extension can't set httpOnly cookies
        sameSite: "lax",
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      },
    });
  } catch (error) {
    console.error("[Extension Auth API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
