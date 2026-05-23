import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

export default function GoogleCallback() {
  const { handleGoogleCallback } = useAuth();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Signing you in with Google...");

  useEffect(() => {
    (async () => {
      try {
        // Preferred: token stashed by main.tsx before the router ran.
        let token: string | null = null;
        if (window.__googleCallback?.token) {
          token = window.__googleCallback.token;
          delete window.__googleCallback;
        } else {
          // Fallback: parse the token straight off the URL in case main.tsx
          // didn't catch it (e.g. direct navigation in dev).
          const fullUrl = window.location.href;
          const tokenMatch = fullUrl.match(/[?&]token=([^&#]+)/);
          token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
        }

        if (token) {
          setStatus("Verifying your account...");
          await handleGoogleCallback(token);
          setStatus("Welcome! Redirecting...");
          setLocation("/");
        } else {
          setError("No authentication token received.");
        }
      } catch (err: any) {
        setError(err.message || "Google sign-in failed");
      }
    })();
  }, [handleGoogleCallback, setLocation]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <a href="/#/" className="text-sm text-primary hover:underline">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
