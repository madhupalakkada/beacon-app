import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Lock, Eye, EyeOff, KeyRound, CheckCircle, ArrowLeft, AlertCircle } from "lucide-react";

type Step = "form" | "done" | "error";

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Extract the access token from the URL hash (Supabase puts it there after email verification)
  useEffect(() => {
    // The URL will look like: /#/reset-password#access_token=xxx&type=recovery
    const fullHash = window.location.hash;
    // After the route part, look for access_token
    const parts = fullHash.split("access_token=");
    if (parts.length > 1) {
      const token = parts[1].split("&")[0];
      if (token) {
        setAccessToken(token);
        return;
      }
    }

    // Also check if token is in the query string after the hash route
    const afterRoute = fullHash.includes("?") ? fullHash.split("?")[1] : "";
    const params = new URLSearchParams(afterRoute);
    const token = params.get("access_token") || params.get("token");
    if (token) {
      setAccessToken(token);
      return;
    }

    // No token found
    setStep("error");
    setErrorMessage("Invalid or expired reset link. Please request a new password reset.");
  }, []);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newPassword || newPassword !== confirmPassword) return;
    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/auth/update-password", {
        accessToken,
        newPassword,
      });
      const data = await res.json();
      if (data.ok) {
        setStep("done");
      } else {
        toast({ title: "Error", description: data.error || "Could not update password", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Password update failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4" data-testid="reset-password-page">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-label="Beacon logo">
            <circle cx="12" cy="12" r="4" fill="white" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Set New Password</h1>
      </div>

      <Card className="w-full max-w-sm p-6 border border-border/60" data-testid="reset-password-card">
        {/* Error state */}
        {step === "error" && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="font-semibold text-lg mb-2">Invalid Link</h2>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Link href="/forgot-password">
              <Button className="mt-4 w-full gap-2" data-testid="btn-request-new-reset">
                Request New Reset Link
              </Button>
            </Link>
          </div>
        )}

        {/* Set new password form */}
        {step === "form" && accessToken && (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-semibold text-lg">Choose a new password</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your identity has been verified. Set your new password below.
              </p>
            </div>
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium">New password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                    autoFocus
                    data-testid="input-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                    data-testid="input-confirm-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full gap-2"
                data-testid="btn-set-password"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Updating...
                  </span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Set New Password
                  </>
                )}
              </Button>
            </form>
          </>
        )}

        {/* Success */}
        {step === "done" && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="font-semibold text-lg mb-2">Password updated</h2>
            <p className="text-sm text-muted-foreground">
              Your password has been changed successfully. You can now sign in with your new password.
            </p>
            <Link href="/">
              <Button className="mt-4 w-full gap-2" data-testid="btn-go-login">
                <ArrowLeft className="w-4 h-4" />
                Go to Sign In
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}