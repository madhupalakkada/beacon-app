import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound, CheckCircle, Search } from "lucide-react";

type Step = "email" | "reset" | "done";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/auth/verify-email", { email: email.trim().toLowerCase() });
      const data = await res.json();
      setDisplayName(data.displayName);
      setStep("reset");
    } catch (err: any) {
      const msg = err?.message || "Something went wrong";
      const cleaned = msg.replace(/^\d+:\s*/, "");
      toast({
        title: "Account not found",
        description: cleaned.includes("No account")
          ? "No account found with this email. Please create an account first."
          : cleaned,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both passwords are identical.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/auth/reset-password", { email: email.trim().toLowerCase(), newPassword });
      const data = await res.json();
      setStep("done");
      if (data.emailSent) {
        toast({ title: "Check your email", description: "We sent a password reset link to your email." });
      } else {
        toast({ title: "Password updated", description: "You can now sign in with your new password." });
      }
    } catch (err: any) {
      const msg = err?.message || "Something went wrong";
      toast({ title: "Reset failed", description: msg.replace(/^\d+:\s*/, ""), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4" data-testid="forgot-password-page">
      {/* Beacon branding */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-label="Beacon logo">
            <circle cx="12" cy="12" r="4" fill="white" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Beacon</h1>
      </div>

      <Card className="w-full max-w-sm p-6 border border-border/60" data-testid="forgot-password-card">

        {/* Step 1: Enter email */}
        {step === "email" && (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-semibold text-lg">Forgot password?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your email address and we'll help you set a new password.
              </p>
            </div>

            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm font-medium">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoFocus
                    data-testid="input-reset-email"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full gap-2"
                data-testid="btn-verify-email"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Find my account
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center space-y-2">
              <Link href="/">
                <span className="text-sm text-primary hover:underline cursor-pointer inline-flex items-center gap-1" data-testid="link-back-login">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to sign in
                </span>
              </Link>
              <p className="text-xs text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/">
                  <span className="text-primary hover:underline cursor-pointer" data-testid="link-create-account">
                    Create one
                  </span>
                </Link>
              </p>
            </div>
          </>
        )}

        {/* Step 2: Set new password */}
        {step === "reset" && (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-semibold text-lg">Set new password</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Hi {displayName}, choose a new password for your account.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium">New password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a new password (min 6 chars)"
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
                    data-testid="toggle-new-password-visibility"
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
                    placeholder="Re-enter your new password"
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
                    data-testid="toggle-confirm-password-visibility"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive" data-testid="password-mismatch-error">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full gap-2"
                data-testid="btn-reset-password"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Updating password...
                  </span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Update password
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => { setStep("email"); setNewPassword(""); setConfirmPassword(""); }}
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                data-testid="link-back-email-step"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Use a different email
              </button>
            </div>
          </>
        )}

        {/* Step 3: Success */}
        {step === "done" && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="font-semibold text-lg" data-testid="reset-success-heading">Password updated</h2>
            <p className="text-sm text-muted-foreground mt-2 mb-6">
              Your password has been successfully changed. You can now sign in with your new password.
            </p>
            <Link href="/">
              <Button className="w-full gap-2" data-testid="btn-go-to-login">
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}