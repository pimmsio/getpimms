import { pimms } from "@/lib/pimms";
import { User } from "next-auth";
import { cookies } from "next/headers";

export const trackLead = async (user: User) => {
  const clickId =
    cookies().get("pimms_id")?.value || cookies().get("dclid")?.value;
  
  const anonymousId = cookies().get("pimms_anonymous_id")?.value;
  
  if (!clickId) {
    console.log("No clickId cookie found, skipping lead tracking...");
    return;
  }

  // send the lead event to PIMMS
  await pimms.track.lead({
    clickId,
    eventName: "Sign Up",
    externalId: user.id,
    customerName: user.name,
    customerEmail: user.email,
    customerAvatar: user.image,
  });

  // Store anonymousId association for future click history retrieval
  if (anonymousId) {
    // TODO: Store anonymousId in customer record or separate table
    // For now, just log it
    console.log('Would store anonymousId association:', { 
      customerId: user.id, 
      anonymousId,
      email: user.email 
    });
  }

  // delete the clickId cookie
  // cookies().delete("pimms_id");
  // cookies().delete("dclid");
};
