import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, UserPlus, LogIn, Sparkles } from "lucide-react";
import loginBg from "@assets/login-bg.jpg";

export default function LoginPage() {
  const { login, register, googleLogin } = useAuth();
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden" data-testid="login-page">
      {/* Empathetic background image */}
      <div className="absolute inset-0 z-0">
        <img src={loginBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background/80" />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full">
      {/* Beacon branding */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-label="Beacon logo">
            <circle cx="12" cy="12" r="4" fill="white" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight drop-shadow-sm">Beacon</h1>
        <p className="text-sm text-foreground/70 mt-1 max-w-xs mx-auto drop-shadow-sm">
          Share gratitude, spread smiles, and brighten the world together.
        </p>
      </div>

      <Card className="w-full max-w-sm p-6 border border-border/60 bg-background/95 backdrop-blur-sm shadow-xl" data-testid="login-card">
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

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">or continue with</span>
          </div>
        </div>

        {/* Google Sign-In */}
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={async () => {
            try {
              await googleLogin();
            } catch {
              toast({ title: "Error", description: "Could not connect to Google.", variant: "destructive" });
            }
          }}
          data-testid="google-login-btn"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </Button>
      </Card>

      {/* Tagline */}
      <div className="mt-8 text-center">
        <p className="text-xs text-foreground/70 flex items-center justify-center gap-1.5 drop-shadow-sm">
          <Sparkles className="w-3 h-3 text-primary" />
          Improving the happiness index of the world
        </p>
      </div>
      </div>
    </div>
  );
}