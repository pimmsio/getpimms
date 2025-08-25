import { cookies } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const pimmsId = cookieStore.get("pimms_id")?.value;
  const dclid = cookieStore.get("dclid")?.value;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  const clickId = pimmsId || dclid;

  console.log("id", id);
  console.log("clickId", clickId);

  if (!id) {
    console.log("No id found in URL");
  }

  if (!clickId) {
    console.log("No click ID found in cookies");
  }

  // add client_reference_id only when it exists.
  const redirectUrl = `https://buy.stripe.com/${id}${clickId ? `?client_reference_id=pimms_id_${clickId}` : ""}`;

  redirect(redirectUrl, RedirectType.replace);
}
