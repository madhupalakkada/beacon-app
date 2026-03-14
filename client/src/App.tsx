import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Feed from "@/pages/feed";
import AuthPage from "@/pages/auth";
import CreatePost from "@/pages/create-post";
import Profile from "@/pages/profile";
import Leaderboard from "@/pages/leaderboard";
import Shop from "@/pages/shop";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Feed} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/create" component={CreatePost} />
      <Route path="/profile/:username" component={Profile} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/shop" component={Shop} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
