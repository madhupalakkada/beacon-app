import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Heart, Award, Sparkles, Gift, Calendar, ImageOff, Crown } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function getRankStyle(rank: number) {
  if (rank === 0) return {
    border: "border-amber-300 dark:border-amber-600",
    bg: "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/30",
    badge: "bg-amber-500 text-white",
    label: "🥇 1st",
    glow: "shadow-amber-200/50 dark:shadow-amber-900/30 shadow-lg",
  };
  if (rank === 1) return {
    border: "border-gray-300 dark:border-gray-600",
    bg: "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/40 dark:to-slate-950/30",
    badge: "bg-gray-400 text-white",
    label: "🥈 2nd",
    glow: "",
  };
  if (rank === 2) return {
    border: "border-orange-300 dark:border-orange-700",
    bg: "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20",
    badge: "bg-orange-600 text-white",
    label: "🥉 3rd",
    glow: "",
  };
  return {
    border: "border-border/60",
    bg: "bg-card",
    badge: "bg-muted text-muted-foreground",
    label: `#${rank + 1}`,
    glow: "",
  };
}

export default function Leaderboard() {
  const { data: topPosts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/posts/weekly-top"],
  });

  // The winner is the post with the most likes this week (first in the sorted list)
  const winner = topPosts && topPosts.length > 0 ? topPosts[0] : null;
  const runnerUps = topPosts ? topPosts.slice(1) : [];

  return (
    <div className="space-y-5" data-testid="leaderboard-page">
      {/* Header */}
      <div>
        <h1 className="font-bold text-base flex items-center gap-2" data-testid="leaderboard-title">
          <Sparkles className="w-5 h-5 text-primary" />
          Best Gratitude Bliss
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          The most loved gratitude post each week wins the Best Gratitude Bliss prize.
        </p>
      </div>

      {/* Prize Info Banner */}
      <Card className="p-4 border-2 border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-500" />
              Weekly Prize
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              The post with the most likes each week is crowned the <span className="font-semibold text-primary">Best Gratitude Bliss</span>. Share your gratitude story, collect likes, and win recognition and prizes from our community partners.
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              Resets every Sunday at midnight
            </div>
          </div>
        </div>
      </Card>

      {/* This Week's Winner */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : winner ? (
        <>
          {/* Winner Card - Featured */}
          <div className="relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                This Week's Gratitude Bliss
              </span>
            </div>
            <WinnerCard post={winner} />
          </div>

          {/* Runner Ups */}
          {runnerUps.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                <Heart className="w-4 h-4" />
                Top Contenders
              </h2>
              {runnerUps.map((post: any, index: number) => (
                <ContenderCard key={post.id} post={post} rank={index + 1} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary/40" />
          </div>
          <p className="text-sm font-medium">No posts this week yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Be the first to share your gratitude and claim this week's Bliss.
          </p>
          <Link href="/create">
            <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors" data-testid="btn-create-first-post">
              Share Your Gratitude
            </button>
          </Link>
        </div>
      )}

      {/* How It Works */}
      <Card className="p-4 border border-border/60">
        <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-primary" />
          How It Works
        </p>
        <div className="space-y-2.5">
          {[
            { step: "1", text: "Share a gratitude post with your smile and story" },
            { step: "2", text: "Community members like the posts that inspire them" },
            { step: "3", text: "The post with the most likes by Sunday wins the Best Gratitude Bliss" },
            { step: "4", text: "Winners receive recognition badges and community prizes" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                {item.step}
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function WinnerCard({ post }: { post: any }) {
  const [imgError, setImgError] = useState(false);
  const style = getRankStyle(0);

  return (
    <Card className={`p-5 border-2 ${style.border} ${style.bg} ${style.glow} mt-4`} data-testid={`winner-post-${post.id}`}>
      <div className="flex flex-col items-center text-center">
        {/* Post image */}
        <div className="w-full h-48 rounded-xl overflow-hidden bg-muted mb-4">
          {imgError ? (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff className="w-8 h-8 text-muted-foreground/30" />
            </div>
          ) : (
            <img
              src={post.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          )}
        </div>

        {/* Story */}
        <p className="text-sm font-medium leading-relaxed line-clamp-3 mb-3">{post.story}</p>

        {/* Author */}
        <Link href={post.user ? `/profile/${post.user.id}` : "#"}>
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
              {post.user ? getInitials(post.user.displayName) : "?"}
            </div>
            <span className="text-sm font-semibold">{post.user?.displayName || "Anonymous"}</span>
          </div>
        </Link>

        {/* Likes count */}
        <div className="flex items-center gap-1.5 mt-3 text-lg font-bold text-red-500">
          <Heart className="w-5 h-5 fill-red-500" />
          {post.likes} likes
        </div>
      </div>
    </Card>
  );
}

function ContenderCard({ post, rank }: { post: any; rank: number }) {
  const [imgError, setImgError] = useState(false);
  const style = getRankStyle(rank);

  return (
    <Card className={`p-4 border ${style.border} ${style.bg}`} data-testid={`contender-post-${post.id}`}>
      <div className="flex items-start gap-3">
        <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${style.badge}`}>
          {style.label}
        </span>
        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted">
          {imgError ? (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff className="w-5 h-5 text-muted-foreground/40" />
            </div>
          ) : (
            <img
              src={post.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium line-clamp-2">{post.story}</p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{post.user?.displayName}</span>
            <span className="flex items-center gap-0.5 text-red-400">
              <Heart className="w-3 h-3 fill-red-400" />
              {post.likes}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}