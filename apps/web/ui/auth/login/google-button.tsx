import { Button } from "@dub/ui";
import { Google } from "@dub/ui/icons";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useContext } from "react";
import { CBE_DOMAIN } from "@dub/utils";
import { LoginFormContext } from "./login-form";

export function GoogleButton({ next }: { next?: string }) {
  const searchParams = useSearchParams();
  const finalNext = next ?? searchParams?.get("next");

  const { setClickedMethod, clickedMethod, setLastUsedAuthMethod } =
    useContext(LoginFormContext);

  // Check if we're on CBE domain
  const isCbeDomain = typeof window !== 'undefined' && 
    (window.location.hostname.includes('cbe.') || window.location.port === '8888');

  return (
    <Button
      text="Continue with Google"
      variant="secondary"
      onClick={() => {
        setClickedMethod("google");
        setLastUsedAuthMethod("google");
        
        const callbackUrl = isCbeDomain 
          ? `${CBE_DOMAIN}/success` 
          : finalNext;
          
        signIn("google", {
          ...(callbackUrl && callbackUrl.length > 0
            ? { callbackUrl }
            : {}),
        });
      }}
      loading={clickedMethod === "google"}
      disabled={clickedMethod && clickedMethod !== "google"}
      icon={<Google className="size-4" />}
    />
  );
}
