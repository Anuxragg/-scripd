"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGoogleLogin } from "@/features/auth/hooks";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleLoginButtonProps {
  mode?: "signin" | "signup";
  onSuccess?: () => void;
}

export function GoogleLoginButton({ mode = "signin", onSuccess }: GoogleLoginButtonProps) {
  const router = useRouter();
  const googleLoginMutation = useGoogleLogin();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) {
        setErrorMessage("Google did not return credentials. Please try again.");
        return;
      }
      setErrorMessage(null);
      try {
        await googleLoginMutation.mutateAsync(response.credential);
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/");
          router.refresh();
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to sign in with Google. Please try again.";
        setErrorMessage(message);
      }
    },
    [googleLoginMutation, onSuccess, router],
  );

  useEffect(() => {
    if (!scriptLoaded || !googleClientId || !buttonRef.current || !window.google?.accounts?.id) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Clear any prior rendered button children before re-rendering
      buttonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        text: mode === "signup" ? "signup_with" : "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: 320,
      });
    } catch {
      // Ignore Google Identity script re-init warnings
    }
  }, [scriptLoaded, googleClientId, mode, handleCredentialResponse]);

  return (
    <div className="w-full flex flex-col items-center">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      {googleClientId ? (
        <div className="w-full flex justify-center min-h-[44px]">
          <div ref={buttonRef} className="w-full flex justify-center" />
        </div>
      ) : (
        <div className="w-full py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 text-zinc-400 text-xs text-center">
          Google Login enabled. Set{" "}
          <code className="text-zinc-200">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in environment.
        </div>
      )}

      {errorMessage && (
        <p className="mt-2 text-xs text-rose-400 text-center font-medium">{errorMessage}</p>
      )}

      {googleLoginMutation.isPending && (
        <p className="mt-2 text-xs text-zinc-400 text-center animate-pulse">
          Authenticating with Google…
        </p>
      )}
    </div>
  );
}
