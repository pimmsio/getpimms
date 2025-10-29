import { checkAccountExistsAction } from "@/lib/actions/check-account-exists";
import { CtaButton, Input, useMediaQuery } from "@dub/ui";
import { cn, CBE_DOMAIN } from "@dub/utils";
import { signIn } from "next-auth/react";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useState } from "react";
import { toast } from "sonner";
import { errorCodes, LoginFormContext } from "./login-form";

export const EmailSignIn = ({ next }: { next?: string }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const finalNext = next ?? searchParams?.get("next");
  const { isMobile } = useMediaQuery();
  
  // Check if we're on CBE domain
  const isCbeDomain = typeof window !== 'undefined' && 
    window.location.hostname.startsWith('cbe.');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const {
    showPasswordField,
    setShowPasswordField,
    setClickedMethod,
    authMethod,
    setAuthMethod,
    clickedMethod,
    setLastUsedAuthMethod,
    setShowSSOOption,
  } = useContext(LoginFormContext);

  const { executeAsync, isPending } = useAction(checkAccountExistsAction, {
    onError: ({ error }) => {
      toast.error(error.serverError);
    },
  });

  return (
    <>
      <form
        onSubmit={async (e) => {
          e.preventDefault();

          // Check if the user can enter a password, and if so display the field
          if (!showPasswordField) {
            const result = await executeAsync({ email });

            if (!result?.data) {
              return;
            }

            const { accountExists, hasPassword } = result.data;

            if (accountExists && hasPassword) {
              setShowPasswordField(true);
              return;
            }

            if (!accountExists) {
              setClickedMethod(undefined);
              toast.error("No account found with that email address.");
              return;
            }
          }

          setClickedMethod("email");

          const result = await executeAsync({ email });

          if (!result?.data) {
            return;
          }

          const { accountExists, hasPassword } = result.data;

          if (!accountExists) {
            setClickedMethod(undefined);
            toast.error("No account found with that email address.");
            return;
          }

          const provider = password && hasPassword ? "credentials" : "email";

          const callbackUrl = isCbeDomain 
            ? `${CBE_DOMAIN}/success` 
            : (finalNext || "/workspaces");
            
          const response = await signIn(provider, {
            email,
            redirect: false,
            callbackUrl,
            ...(password && { password }),
          });

          if (!response) {
            return;
          }

          if (!response.ok && response.error) {
            if (errorCodes[response.error]) {
              toast.error(errorCodes[response.error]);
            } else {
              toast.error(response.error);
            }

            setClickedMethod(undefined);
            return;
          }

          setLastUsedAuthMethod("email");

          if (provider === "email") {
            toast.success("Email sent - check your inbox!");
            setEmail("");
            setClickedMethod(undefined);
            return;
          }

          if (provider === "credentials") {
            router.push(response?.url || finalNext || "/workspaces");
          }
        }}
        className="flex flex-col gap-y-3"
      >
        {authMethod === "email" && (
          <input
            id="email"
            name="email"
            autoFocus={!isMobile && !showPasswordField}
            type="email"
            placeholder="cheers@pimms.io"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            size={1}
            className={cn(
              "block w-full min-w-0 appearance-none rounded-full border border-neutral-200 text-black placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-0 sm:text-sm",
              {
                "pr-10": isPending,
              },
            )}
          />
        )}

        {showPasswordField && (
          <div>
            <Input
              type="password"
              autoFocus={!isMobile}
              value={password}
              placeholder="Password (optional)"
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-full"
            />
          </div>
        )}

        <CtaButton
          {...(authMethod !== "email" && {
            type: "button",
            onClick: (e) => {
              e.preventDefault();
              setShowSSOOption(false);
              setAuthMethod("email");
            },
          })}
          loading={clickedMethod === "email" || isPending}
          disabled={clickedMethod && clickedMethod !== "email"}
          className="my-2"
        >
          {`Continue with ${password ? "Password" : "Email"}`}
        </CtaButton>
      </form>
      {showPasswordField && (
        <Link
          href={`/forgot-password?email=${encodeURIComponent(email)}`}
          className="text-center text-xs text-neutral-500 transition-colors hover:text-black"
        >
          Forgot password?
        </Link>
      )}
    </>
  );
};
