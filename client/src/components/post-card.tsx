import { Heart, Gift, CheckCircle, MapPin, ImageOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Link } from "wouter";

interface PostUser {
  id: string;
  displayName: string;
  username: string;
  avatar: string | null;
  smileStreak?: number;
}

interface PostData {
  id: string;
  userId: string;
  imageUrl: string;
  story: string;
  gratitudeReason: string;
  category: string;
  likes: number;
  tips: number;
  isVerified: boolean;
  createdAt: string;
  region: string | null;
  user: PostUser | null;
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const categoryColors: Record<string, string> = {
  Family: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  Nature: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Friendship: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  Career: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Wellness: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  Kindness: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Community: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

export default function PostCard({ post }: { post: PostData }) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.likes ?? 0);
  const [localTips, setLocalTips] = useState(post.tips ?? 0);
  const [imgError, setImgError] = useState(false);

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/posts/${post.id}/like`, { userId: currentUser?.id });
      return res.json();
    },
    onSuccess: () => {
      setLiked(true);
      setLocalLikes((prev) => prev + 1);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const tipMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/posts/${post.id}/tip`, {
        fromUserId: currentUser?.id,
        toUserId: post.userId,
        amount: 1,
      });
      return res.json();
    },
    onSuccess: () => {
      setLocalTips((prev) => prev + 1);
      toast({ title: "Tip sent", description: "You sent a token of appreciation." });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const catColor = categoryColors[post.category] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  return (
    <Card className="overflow-hidden border border-border/60 hover:shadow-md transition-shadow duration-200" data-testid={`post-card-${post.id}`}>
      {/* User header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Link href={`/profile/${post.userId}`}>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm cursor-pointer hover:bg-primary/15 transition-colors" data-testid={`avatar-${post.userId}`}>
            {post.user ? getInitials(post.user.displayName) : "?"}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${post.userId}`}>
              <span className="font-semibold text-sm hover:underline cursor-pointer" data-testid={`username-${post.id}`}>
                {post.user?.displayName ?? "Unknown"}
              </span>
            </Link>
            {post.isVerified && (
              <CheckCircle className="w-3.5 h-3.5 text-primary fill-primary/20" />
            )}
            {post.user?.smileStreak && post.user.smileStreak >= 7 && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {post.user.smileStreak}d streak
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{getTimeAgo(post.createdAt)}</span>
            {post.region && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />
                  {post.region}
                </span>
              </>
            )}
          </div>
        </div>
        <Badge variant="secondary" className={`text-[11px] px-2 py-0.5 font-medium ${catColor}`}>
          {post.category}
        </Badge>
      </div>

      {/* Image with fallback */}
      <div className="relative aspect-[3/2] bg-muted">
        {imgError ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="w-8 h-8 opacity-40" />
            <span className="text-xs opacity-60">Photo unavailable</span>
          </div>
        ) : (
          <img
            src={post.imageUrl}
            alt={post.gratitudeReason}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
            data-testid={`post-image-${post.id}`}
          />
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <p className="text-sm leading-relaxed" data-testid={`post-story-${post.id}`}>{post.story}</p>
        <p className="text-xs text-primary font-medium" data-testid={`post-gratitude-${post.id}`}>
          {post.gratitudeReason}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-1 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1.5 text-xs transition-all ${liked ? "text-red-500" : "text-muted-foreground hover:text-red-400"}`}
            onClick={() => !liked && likeMutation.mutate()}
            disabled={liked || likeMutation.isPending}
            data-testid={`like-btn-${post.id}`}
          >
            <Heart className={`w-4 h-4 transition-all ${liked ? "fill-red-500 scale-110" : ""}`} />
            {localLikes}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground hover:text-emerald-600"
            onClick={() => tipMutation.mutate()}
            disabled={tipMutation.isPending}
            data-testid={`tip-btn-${post.id}`}
          >
            <Gift className="w-4 h-4" />
            {localTips} tips
          </Button>
        </div>
      </div>
    </Card>
  );
}