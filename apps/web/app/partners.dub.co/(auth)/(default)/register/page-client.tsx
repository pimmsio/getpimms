"use client";

import {
  RegisterProvider,
  useRegisterContext,
} from "@/ui/auth/register/context";
import { SignUpForm } from "@/ui/auth/register/signup-form";
import { VerifyEmailForm } from "@/ui/auth/register/verify-email-form";
import { truncate } from "@dub/utils";
import { Program } from "@prisma/client";
import Link from "next/link";
import { PartnerBanner } from "../partner-banner";

type PartialProgram = Pick<Program, "name" | "logo" | "slug">;

export default function RegisterPageClient({
  program,
  email,
  lockEmail,
}: {
  program?: PartialProgram;
  email?: string;
  lockEmail?: boolean;
}) {
  return (
    <RegisterProvider email={email} lockEmail={lockEmail}>
      <div className="mx-auto my-10 w-full max-w-[480px] md:mt-20 lg:mt-20">
        <RegisterFlow program={program} />
      </div>
    </RegisterProvider>
  );
}

function SignUp({ program }: { program?: PartialProgram }) {
  return (
    <>
      {program && <PartnerBanner program={program} />}
      <div className="rounded border border-neutral-100 bg-white p-8 pb-10">
        <h1 className="text-lg font-medium text-neutral-800">
          Create a PIMMS Partner account
        </h1>
        <div className="mt-8">
          <SignUpForm methods={["email", "google"]} />
        </div>
      </div>
      <p className="mt-4 text-center text-sm">
        Already have an account?&nbsp;
        <Link
          href="/login"
          className="font-semibold underline underline-offset-2 transition-colors hover:text-black"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}

function Verify() {
  const { email } = useRegisterContext();

  return (
    <>
      <div className="rounded border border-neutral-100 bg-white p-8 pb-10">
        <h1 className="text-lg font-medium text-neutral-800">
          Verify your email address
        </h1>
        <p className="mt-3 text-sm">
          Enter the six digit verification code sent to{" "}
          <strong className="font-medium text-neutral-600" title={email}>
            {truncate(email, 30)}
          </strong>
        </p>
        <div className="mt-8">
          <VerifyEmailForm />
        </div>
      </div>
      <p className="mt-4 text-center text-sm">
        Already have an account?&nbsp;
        <Link
          href="/login"
          className="font-semibold underline underline-offset-2 transition-colors hover:text-black"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}

const RegisterFlow = ({ program }: { program?: PartialProgram }) => {
  const { step } = useRegisterContext();

  if (step === "signup") return <SignUp program={program} />;
  if (step === "verify") return <Verify />;
};
