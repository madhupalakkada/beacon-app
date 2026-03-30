import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

export default function GoogleCallback() {
  const { handleGoogleCallback } = useAuth();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Extract token from the URL
        const hash = window.location.hash;
        const afterRoute = hash.includes("?") ? hash.split("?")[1] : "";
        const params = new URLSearchParams(afterRoute);
        const token = params.get("token");

        if (token) {
          await handleGoogleCallback(token);
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
        <p className="text-sm text-muted-foreground">Signing you in with Google...</p>
      </div>
    </div>
  );
}