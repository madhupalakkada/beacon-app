import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, ArrowLeft, CheckCircle, Search, Send } from "lucide-react";

type Step = "email" | "sent";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/auth/send-reset-email", { email: email.trim().toLowerCase() });
      const data = await res.json();
      setDisplayName(data.displayName || "");
      setStep("sent");
      toast({ title: "Email sent", description: "Check your inbox for the password reset link." });
    } catch (err: any) {
      const msg = err?.message || "Something went wrong";
      const cleaned = msg.replace(/^\d+:\s*/, "");
      toast({
        title: "Error",
        description: cleaned.includes("No account")
          ? "No account found with this email. Please create an account first."
          : cleaned,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4" data-testid="forgot-password-page">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-label="Beacon logo">
            <circle cx="12" cy="12" r="4" fill="white" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Reset Password</h1>
      </div>

      <Card className="w-full max-w-sm p-6 border border-border/60" data-testid="forgot-password-card">
        {/* Step 1: Enter email */}
        {step === "email" && (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-semibold text-lg">Find your account</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your email and we'll send you a link to reset your password.
              </p>
            </div>
            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
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
                    autoFocus
                    data-testid="input-email"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full gap-2"
                data-testid="btn-send-reset"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/">
                <span className="text-sm text-primary hover:underline cursor-pointer inline-flex items-center gap-1" data-testid="link-back-login">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to sign in
                </span>
              </Link>
            </div>
          </>
        )}

        {/* Step 2: Email sent confirmation */}
        {step === "sent" && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="font-semibold text-lg mb-2">Check your email</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We sent a password reset link to{" "}
              <span className="font-medium text-foreground">{email}</span>
              {displayName && (
                <span> for account <span className="font-medium text-foreground">{displayName}</span></span>
              )}.
            </p>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Click the link in the email to set a new password. The link expires in 1 hour.
            </p>
            <div className="mt-6 space-y-2">
              <Button
                variant="outline"
                onClick={() => { setStep("email"); setEmail(""); }}
                className="w-full gap-2"
                data-testid="btn-try-different-email"
              >
                <Search className="w-4 h-4" />
                Try a different email
              </Button>
              <Link href="/">
                <Button variant="ghost" className="w-full gap-2" data-testid="btn-back-login">
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}