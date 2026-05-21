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
        // Extract token from the URL - URL format: http://localhost:5000/#/google-callback?token=eyJ...
        const fullUrl = window.location.href;
        const tokenMatch = fullUrl.match(/[?&]token=([^&]+)/);
        const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

        if (token) {
          setStatus("Verifying your account...");
          await handleGoogleCallback(token);
          setStatus("Welcome! Redirecting...");
          // Small delay so user sees success, then navigate
          setTimeout(() => setLocation("/"), 300);
        } else {
          setError("No authentication token received.");
        }
      } catch (err: any) {
        console.error("Google callback error:", err);
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