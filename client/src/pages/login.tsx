import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, UserPlus, LogIn, Sparkles } from "lucide-react";

export default function LoginPage() {
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isRegister) {
        if (!displayName.trim() || !username.trim()) {
          toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
        await register({ email: email.trim().toLowerCase(), password, displayName: displayName.trim(), username: username.trim().toLowerCase() });
        toast({ title: "Welcome to Beacon", description: "Your account has been created." });
      } else {
        await login(email.trim().toLowerCase(), password);
      }
    } catch (err: any) {
      const msg = err?.message || "Something went wrong";
      toast({ title: isRegister ? "Registration failed" : "Login failed", description: msg.replace(/^\d+:\s*/, ""), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4" data-testid="login-page">
      {/* Beacon branding */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-label="Beacon logo">
            <circle cx="12" cy="12" r="4" fill="white" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Beacon</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
          Share gratitude, spread smiles, and brighten the world together.
        </p>
      </div>

      <Card className="w-full max-w-sm p-6 border border-border/60" data-testid="login-card">
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${
              !isRegister
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-login"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${
              isRegister
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-register"
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your full name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10"
                    required
                    data-testid="input-display-name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <Input
                    id="username"
                    type="text"
                    placeholder="choose_a_username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, "").toLowerCase())}
                    className="pl-10"
                    required
                    data-testid="input-username"
                  />
                </div>
              </div>
            </>
          )}

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
                data-testid="input-email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={isRegister ? "Create a password (min 6 chars)" : "Your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                minLength={isRegister ? 6 : 1}
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                data-testid="toggle-password-visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isRegister && (
            <div className="flex justify-end -mt-1">
              <Link href="/forgot-password">
                <span className="text-xs text-primary hover:underline cursor-pointer" data-testid="link-forgot-password">
                  Forgot password?
                </span>
              </Link>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || !email || !password}
            className="w-full gap-2"
            data-testid="submit-auth"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                {isRegister ? "Creating account..." : "Signing in..."}
              </span>
            ) : (
              <>
                {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                {isRegister ? "Create Account" : "Sign In"}
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Tagline */}
      <div className="mt-8 text-center">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3 text-primary" />
          Improving the happiness index of the world
        </p>
      </div>
    </div>
  );
}
