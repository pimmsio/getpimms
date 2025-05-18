import { withSession } from "@/lib/auth";
import z from "@/lib/zod";
import { resend } from "@dub/email/resend";
import { SupportRequestEmail } from "@dub/email/templates/support-email";
import { NextResponse } from "next/server";

const supportRequestQuerySchema = z.object({
  message: z.string().min(1),
  attachmentIds: z.array(z.string()),
});

// POST /api/support – file a support request
export const POST = withSession(async ({ req, session }) => {
  const { message, attachmentIds } = supportRequestQuerySchema.parse(
    await req.json(),
  );

  if (!session.user.email) {
    return NextResponse.json({
      error: "Invalid user email",
    });
  }

  // let plainCustomerId: string | null = null;

  // const plainCustomer = await plain.getCustomerByEmail({
  //   email: session.user.email,
  // });

  // if (plainCustomer.data) {
  //   plainCustomerId = plainCustomer.data.id;
  // } else {
  //   const { data, error } = await upsertPlainCustomer(session.user);
  //   if (error) {
  //     return NextResponse.json({
  //       error: error.message,
  //     });
  //   }

  //   if (data) {
  //     plainCustomerId = data.customer.id;
  //   }
  // }

  // if (!plainCustomerId) {
  //   return NextResponse.json({
  //     error: "Plain customer not found",
  //   });
  // }

  // const res = await plain.createThread({
  //   customerIdentifier: {
  //     customerId: plainCustomerId,
  //   },
  //   components: [
  //     {
  //       componentText: {
  //         text: message,
  //       },
  //     },
  //   ],
  //   attachmentIds,
  // });

  // send email to support@pimms.io

  await resend?.emails.send({
    from: "alexandre+support@pimms.io",
    to: "alexandre@pimms.io",
    ...(session.user.email && { replyTo: session.user.email }),
    subject: "🎉 New Support Request Received!",
    react: SupportRequestEmail({ email: session.user.email, message }),
  });

  return NextResponse.json({
    success: true,
  });
});
