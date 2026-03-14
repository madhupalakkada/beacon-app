import { Link, useLocation } from "wouter";
import { Home, PlusCircle, Trophy, ShoppingBag, User, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "./theme-provider";
import { useAuth } from "@/lib/auth";
import { PerplexityAttribution } from "./PerplexityAttribution";

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/", label: "Feed", icon: Home },
    { href: "/create", label: "Post", icon: PlusCircle },
    { href: "/leaderboard", label: "Top", icon: Trophy },
    { href: "/shop", label: "Shop", icon: ShoppingBag },
    { href: user ? `/profile/${user.id}` : "/", label: "Me", icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background" data-testid="app-layout">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" data-testid="logo-link">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-label="Beacon logo">
                  <circle cx="12" cy="12" r="4" fill="white" />
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight">Beacon</span>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            {user && (
              <Link href={`/profile/${user.id}`}>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer" data-testid="user-header-info">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                    {getInitials(user.displayName)}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline max-w-[100px] truncate">{user.displayName}</span>
                </div>
              </Link>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              data-testid="theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Sign out"
              data-testid="logout-btn"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Bottom Navigation (mobile-style) */}
      <nav className="sticky bottom-0 z-50 bg-background/80 backdrop-blur-md border-t border-border" data-testid="bottom-nav">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const isActive = item.href === "/"
                ? location === "/"
                : location.startsWith(item.href);
              return (
                <Link key={item.label} href={item.href}>
                  <button
                    className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-[11px] font-medium">{item.label}</span>
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pb-4">
        <PerplexityAttribution />
      </div>
    </div>
  );
}