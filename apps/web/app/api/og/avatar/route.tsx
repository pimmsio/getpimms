import { NextRequest, NextResponse } from "next/server";
import { getSoberAvatarResponse } from "./sober-avatar";
import { getAvatarSvgCached, generateAvatarSeed } from "./dicebear-utils";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    const { searchParams } = new URL(req.url);
    const seed = searchParams.get("seed");
    const name = searchParams.get("name");
    const sober = searchParams.get("sober") === "true";
    
    // Validate required parameters
    if (!seed || seed.trim() === "") {
      return new NextResponse("Missing or invalid seed parameter", { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Set up CORS headers
    const corsHeaders: Record<string, string> = {
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (origin && origin.endsWith(".dub.co")) {
      corsHeaders["Access-Control-Allow-Origin"] = origin;
    }

    // Use sober (geometric) style if requested
    if (sober) {
      corsHeaders["Content-Type"] = "image/png";
      return getSoberAvatarResponse(seed, corsHeaders);
    }

    // Use DiceBear style for regular avatars
    try {
      corsHeaders["Content-Type"] = "image/svg+xml";
      
      // Generate avatar seed with gender detection
      const avatarSeed = generateAvatarSeed(seed, name ?? undefined);
      const svgString = await getAvatarSvgCached(avatarSeed);

      // Validate that we got a valid SVG
      if (!svgString || svgString.trim() === "" || !svgString.includes("<svg")) {
        throw new Error("Invalid SVG generated");
      }

      return new NextResponse(svgString, {
        headers: corsHeaders,
      });
    } catch (dicebearError) {
      console.error("DiceBear avatar generation failed:", dicebearError);
      
      // Fallback to sober avatar if DiceBear fails
      corsHeaders["Content-Type"] = "image/png";
      return getSoberAvatarResponse(seed, corsHeaders);
    }
  } catch (error) {
    console.error("Avatar generation error:", error);
    
    // Ultimate fallback - return a simple error response
    return new NextResponse("Avatar generation failed", { 
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }
}
