import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Supabase password-recovery links arrive as:
//   /#/reset-password#access_token=...&refresh_token=...&type=recovery
// With hash-based routing the secondary '#' breaks the route match, so we
// stash the tokens in sessionStorage and rewrite the hash to a clean route
// before the router reads window.location.
(function captureSupabaseRecoveryTokens() {
  const hash = window.location.hash;
  if (!hash) return;

  // Look for a second '#' after the route segment.
  const firstHashIdx = hash.indexOf("#");
  const secondHashIdx = hash.indexOf("#", firstHashIdx + 1);
  if (secondHashIdx === -1) return;

  const routePart = hash.slice(firstHashIdx + 1, secondHashIdx); // e.g. "/reset-password"
  const tokenPart = hash.slice(secondHashIdx + 1);               // e.g. "access_token=...&type=recovery"

  const params = new URLSearchParams(tokenPart);
  const type = params.get("type");
  const accessToken = params.get("access_token");

  if (type === "recovery" && accessToken) {
    const payload: Record<string, string> = {};
    params.forEach((v, k) => {
      payload[k] = v;
    });
    try {
      sessionStorage.setItem("supabase.recovery", JSON.stringify(payload));
    } catch {
      // sessionStorage may be unavailable; reset-password page will fall back to URL parsing.
    }
    // Force the route to reset-password regardless of what came before the second '#'.
    const cleanRoute = routePart && routePart !== "/" ? routePart : "/reset-password";
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${cleanRoute}`);
  }
})();

if (!window.location.hash) {
  window.location.hash = "#/";
}

createRoot(document.getElementById("root")!).render(
  <App />
);
