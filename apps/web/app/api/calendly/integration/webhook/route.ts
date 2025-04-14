import { createId } from "@/lib/api/create-id";
import { includeTags } from "@/lib/api/links/include-tags";
import { getClickEvent, recordLead } from "@/lib/tinybird";
import { sendWorkspaceWebhook } from "@/lib/webhook/publish";
import { transformLeadEventData } from "@/lib/webhook/transform";
import { prisma } from "@dub/prisma";
import { nanoid } from "@dub/utils";
import { Customer } from "@prisma/client";
import { waitUntil } from "@vercel/functions";
import { log } from "@dub/utils";
import { NextResponse } from "next/server";

// POST /api/calendly/webhook — handle Calendly webhooks
export const POST = async (req: Request) => {
  const body = await req.json();

  const eventType = body.event;

  try {
    if (!eventType || eventType !== "invitee.created") {
      throw new Error("Invalid event type", { cause: eventType });
    }

    const payload = body?.payload;

    const email = payload?.email;
    const name = payload?.name;
    const calendlyUri = payload?.uri;
    const createdAt = payload?.created_at;
    const scheduledEvent = payload?.scheduled_event;

    const startTime = scheduledEvent?.start_time;
    const eventTypeName = scheduledEvent?.name;
    const userUri = scheduledEvent?.event_memberships?.[0]?.user;
    const clickId = payload?.tracking?.utm_term?.startsWith("pimms_id_")
      ? payload.tracking.utm_term.substring(9)
      : null;

    console.log("data", {
      email,
      name,
      userUri,
      calendlyUri,
      startTime,
      eventTypeName,
      createdAt,
      clickId
    });

    if (!email || !name || !userUri) {
      console.error("❌ Missing required Calendly invitee data", {
        email,
        name,
        userUri,
      });
      throw new Error("Missing required Calendly invitee data");
    }

    // The client app should always send pimmsClickId (pimms_id) via metadata
    if (!clickId) {
      console.error("❌ Click ID not found in webhook, skipping...");
      throw new Error("Click ID not found in webhook, skipping...");
    }

    // Find click
    const clickEvent = await getClickEvent({ clickId });
    if (!clickEvent || clickEvent.data.length === 0) {
      console.error(
        "❌ Click event with ID",
        clickId,
        "not found, skipping...",
      );
      throw new Error(`Click event with ID ${clickId} not found, skipping...`);
    }

    const clickData = clickEvent.data[0];

    // Find link
    const linkId = clickData.link_id;
    const link = await prisma.link.findUnique({
      where: {
        id: linkId,
      },
    });

    console.log("linkId", linkId);

    if (!link || !link.projectId) {
      console.error(
        "❌ Link with ID",
        linkId,
        "not found or does not have a project, skipping...",
      );
      throw new Error(
        `Link with ID ${linkId} not found or does not have a project, skipping...`,
      );
    }

    const workspaceId = link.projectId;

    // 1. Lookup integrationId from the 'calendly' slug
    const calendlyIntegration = await prisma.integration.findUnique({
      where: { slug: "calendly" },
      select: { id: true },
    });

    if (!calendlyIntegration) {
      console.error("❌ Integration 'calendly' not found");
      throw new Error("Integration 'calendly' not found");
    }

    const integrationId = calendlyIntegration.id;
    console.log("integrationId", integrationId);

    // 2. Find installed integration by credentials.userUri
    const installation = await prisma.installedIntegration.findFirst({
      where: {
        integrationId,
        credentials: {
          path: "$.userUri",
          equals: userUri,
        },
      },
      select: {
        id: true,
      },
    });

    if (!installation) {
      console.error("❌ No matching Calendly installation found", { userUri });
      throw new Error("No matching Calendly installation found");
    }

    console.log("installation", installation);

    // 3. Create a customer
    const customerExternalId = email;

    // Create a function to handle customer upsert to avoid duplication
    const upsertCustomer = async () => {
      return prisma.customer.upsert({
        where: {
          projectId_externalId: {
            projectId: workspaceId,
            externalId: customerExternalId,
          },
        },
        create: {
          id: createId({ prefix: "cus_" }),
          name,
          email,
          // avatar: customerAvatar,
          externalId: customerExternalId,
          projectId: workspaceId,
          clickId: clickData.click_id,
          linkId: clickData.link_id,
          country: clickData.country,
          clickedAt: new Date(clickData.timestamp + "Z"),
        },
        update: {}, // no updates needed if the customer exists
      });
    };

    const customer: Customer = await upsertCustomer();

    const eventName = "Meeting booked";

    const leadData = {
      ...clickData,
      event_id: nanoid(16),
      event_name: eventName,
      customer_id: customer.id,
    };

    console.log("leadData", leadData);

    // 4. Track the lead using Pimms SDK
    const [_lead, linkUpdated, workspace] = await Promise.all([
      // Record lead
      recordLead(leadData),

      // update link leads count
      prisma.link.update({
        where: {
          id: linkId,
        },
        data: {
          leads: {
            increment: 1,
          },
        },
        include: includeTags,
      }),

      // update workspace usage
      prisma.project.update({
        where: {
          id: link.projectId,
        },
        data: {
          usage: {
            increment: 1,
          },
        },
      }),
    ]);

    waitUntil(
      sendWorkspaceWebhook({
        trigger: "lead.created",
        workspace,
        data: transformLeadEventData({
          ...clickData,
          eventName,
          link: linkUpdated,
          customer,
        }),
      }),
    );

    console.log(`✅ Calendly invitee tracked for ${email}`);
    return NextResponse.json({ received: true });
  } catch (error: any) {
    await log({
      message: `Calendly webhook failed. Error: ${error.message}`,
      type: "errors",
    });

    return new Response('Webhook error: "Webhook handler failed. View logs."', {
      status: 400,
    });
  }
};
