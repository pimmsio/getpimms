import { Resend } from "resend";
import { ResendEmailOptions } from "./types";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const VARIANT_TO_FROM_MAP = {
  primary: "Alexandre from PIMMS <alexandre@pimms.io>",
  notifications: "Alexandre from PIMMS <alexandre@pimms.io>",
  marketing: "Alexandre from PIMMS <alexandre@pimms.io>",
};

// Send email using Resend (Recommended for production)
export const sendEmailViaResend = async (opts: ResendEmailOptions) => {
  if (!resend) {
    console.info(
      "RESEND_API_KEY is not set in the .env. Skipping sending email.",
    );
    return;
  }

  const {
    email,
    from,
    variant = "primary",
    bcc,
    replyTo,
    subject,
    text,
    react,
    scheduledAt,
  } = opts;

  if (!subject) {
    throw new Error("Email subject is required.");
  }

  if (!react && !text) {
    throw new Error("Email content is required (react or text).");
  }

  const base = {
    to: email,
    from: from || VARIANT_TO_FROM_MAP[variant],
    bcc: bcc,
    replyTo: replyTo || "alexandre@pimms.io",
    subject,
    scheduledAt,
    ...(variant === "marketing" && {
      headers: {
        "List-Unsubscribe": "https://app.pimms.io/account/settings",
      },
    }),
  } as const;

  if (react) {
    return await resend.emails.send({
      ...base,
      react,
    });
  }

  return await resend.emails.send({
    ...base,
    text: text!,
  });
};
