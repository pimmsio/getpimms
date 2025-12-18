import { handleAndReturnErrorResponse } from "@/lib/api/errors";
import {
  createWindow,
  generateStaticQRCode,
  staticQRCodeImage,
} from "@/lib/qr-codes";
import { CreateStaticQRCodesPostRequestBody } from "@getpimms/types";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// POST /v1/qr-codes/static - create a static qr code
export async function POST(req: NextRequest) {
  const reqBody: CreateStaticQRCodesPostRequestBody = await req.json();

  const imageType = reqBody.image_type || "svg";

  if (imageType && !["jpeg", "jpg", "png", "svg"].includes(imageType)) {
    return handleAndReturnErrorResponse(
      {
        error: {
          code: "bad_request",
          message: "Image type must be either svg, jpeg, or png",
        },
        status: 400,
      },
      CORS_HEADERS,
    );
  }

  // Create SVG Window
  createWindow();

  // fetch frame
  const frameUrl = "https://assets-code.pimms.io/frames/W9_euUlC96pDO72w7xqGk";
  const res = await fetch(frameUrl);
  if (!res.ok) {
    return handleAndReturnErrorResponse(
      {
        error: {
          code: "bad_request",
          message: "Invalid frame URL provided",
        },
        status: 400,
      },
      CORS_HEADERS,
    );
  }

  const frameSvg = await res.text();

  try {
    // Generate QR code
    const qrcode = await generateStaticQRCode(reqBody, frameSvg);

    const imageResponse = await staticQRCodeImage(qrcode, imageType);

    const contentType =
      imageType === "svg" ? "image/svg+xml" : `image/${imageType}`;

    const body =
      typeof imageResponse === "string"
        ? imageResponse
        : new Uint8Array(imageResponse);

    const response = new NextResponse(body);
    response.headers.set("content-type", contentType);
    return response;
  } catch (e) {
    console.error(e);
    return handleAndReturnErrorResponse(
      {
        error: {
          code: "internal_server_error",
          message: "Oups, something wrong happen. Please contact the support.",
        },
        status: 500,
      },
      CORS_HEADERS,
    );
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
