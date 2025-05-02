import { cookies } from "next/headers";
import { redirect, RedirectType } from "next/navigation";

export async function GET() {
  const cookieStore = await cookies();
  const pimmsId = cookieStore.get("pimms_id")?.value;
  const dclid = cookieStore.get("dclid")?.value;

  const clickId = pimmsId || dclid;

  console.log("clickId", clickId);

  if (!clickId) {
    console.log("No click ID found in cookies");
  }

  // add client_reference_id only when it exists.
  const redirectUrl = `https://buy.stripe.com/00g15T7LY4ma2iceUX${
    clickId ? `?client_reference_id=pimms_id_${clickId}` : ""
  }`;

  redirect(redirectUrl, RedirectType.replace);
}
