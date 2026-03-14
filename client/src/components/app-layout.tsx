import { Link, useLocation } from "wouter";
import { Home, PlusCircle, Trophy, ShoppingBag, User } from "lucide-react";

const NAV = [
  { href: "/",           icon: Home,        label: "Feed"      },
  { href: "/create",     icon: PlusCircle,  label: "Post"      },
  { href: "/leaderboard",icon: Trophy,      label: "Leaders"   },
  { href: "/shop",       icon: ShoppingBag, label: "Shop"      },
  { href: "/profile",   icon: User,        label: "Profile"   },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="app-layout">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-label="Beacon logo">
              <circle cx="12" cy="12" r="4" fill="white" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight">Beacon</span>
        </div>
        <div className="text-xs text-muted-foreground">Spreading smiles</div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-lg mx-auto px-4 py-5">
          {children}
        </div>
      </main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50"
        data-testid="bottom-nav"
      >
        <div className="max-w-lg mx-auto flex">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = location === href || (href !== "/" && location.startsWith(href));
            return (
              <Link key={href} href={href} className="flex-1">
                <button
                  className={`w-full py-3 flex flex-col items-center gap-0.5 transition-colors ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`nav-${label.toLowerCase()}`}
                >
                  <Icon className={`w-5 h-5 transition-all ${active ? "scale-110" : ""}`} />
                  <span className={`text-[10px] font-medium ${active ? "font-semibold" : ""}`}>{label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
