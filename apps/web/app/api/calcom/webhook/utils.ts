// Re-export from shared location for backward compatibility
import { checkValidSignature as genericCheckValidSignature } from "@/lib/webhook/signature-utils";

export const checkValidSignature = (req: Request, rawBody: string) => {
  return genericCheckValidSignature(req, rawBody, "x-cal-signature-256");
};
