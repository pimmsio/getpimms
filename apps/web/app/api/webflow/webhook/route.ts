import { POST as genericPost } from "../../webhook/[app]/route";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  return genericPost(req, { params: Promise.resolve({ app: "webflow" }) });
}
