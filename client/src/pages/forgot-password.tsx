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
                Enter your email address and we'll look up your account.
              </p>
            </div>
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full gap-2"
                data-testid="submit-verify-email"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Looking up account...
                  </span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Find my account
                  </>
                )}
              </Button>
            </form>
          </>
        )}

        {/* Step 2: Reset password */}
        {step === "reset" && (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-semibold text-lg">Set new password</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Hi <strong>{displayName}</strong>, choose a new password for your account.
              </p>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">New password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
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
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
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
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || !newPassword || !confirmPassword}
                className="w-full gap-2"
                data-testid="submit-reset-password"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Updating password...
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Update password
                  </>
                )}
              </Button>
            </form>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
              data-testid="back-to-email"
            >
              <ArrowLeft className="w-3 h-3" />
              Use a different email
            </button>
          </>
        )}

        {/* Step 3: Done */}
        {step === "done" && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="font-semibold text-lg mb-2">Password updated!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <Link href="/login">
              <Button className="w-full gap-2" data-testid="go-to-login">
                <LogIn className="w-4 h-4" />
                Sign in now
              </Button>
            </Link>
          </div>
        )}
      </Card>

      <div className="mt-6">
        <Link href="/login">
          <span className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer" data-testid="link-back-to-login">
            <ArrowLeft className="w-3 h-3" />
            Back to sign in
          </span>
        </Link>
      </div>
    </div>
  );
}
