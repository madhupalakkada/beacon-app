import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Heart, MapPin, Tag, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  story: string;
  gratitudeReason: string;
  category: string;
  region?: string | null;
  createdAt: string;
  likesCount?: number;
  likedByUser?: boolean;
  user?: {
    displayName: string;
    username: string;
    avatarUrl?: string;
  };
}

export default function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);

  const liked = optimisticLiked !== null ? optimisticLiked : (post.likedByUser ?? false);
  const count = optimisticCount !== null ? optimisticCount : (post.likesCount ?? 0);

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/posts/${post.id}/like`, { userId: user?.id });
      return res.json();
    },
    onMutate: () => {
      // Optimistic update
      const nextLiked = !liked;
      const nextCount = count + (nextLiked ? 1 : -1);
      setOptimisticLiked(nextLiked);
      setOptimisticCount(nextCount);
    },
    onSuccess: (data) => {
      setOptimisticLiked(data.liked);
      setOptimisticCount(data.likesCount);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: () => {
      // Rollback
      setOptimisticLiked(liked);
      setOptimisticCount(count);
      toast({ title: "Error", description: "Could not like post.", variant: "destructive" });
    },
  });

  const handleShare = async () => {
    const text = `${post.story} — Grateful for: ${post.gratitudeReason}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Beacon Smile", text, url: window.location.href });
      } catch {/* user cancelled */}
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied!", description: "Story copied to clipboard." });
    }
  };

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card" data-testid={`post-card-${post.id}`}>
      {/* Author row */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 overflow-hidden shrink-0">
          {post.user?.avatarUrl ? (
            <img src={post.user.avatarUrl} alt={post.user.displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary font-bold text-sm">
              {(post.user?.displayName?.[0] ?? "?").toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{post.user?.displayName ?? "Unknown"}</p>
          <p className="text-xs text-muted-foreground">@{post.user?.username ?? "unknown"}</p>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>

      {/* Image */}
      <div className="aspect-[3/2] bg-muted overflow-hidden">
        <img
          src={post.imageUrl}
          alt="Smile"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <p className="text-sm leading-relaxed">{post.story}</p>

        <div className="rounded-xl bg-primary/5 border border-primary/10 px-3 py-2">
          <p className="text-xs text-primary font-medium leading-relaxed">✨ {post.gratitudeReason}</p>
        </div>

        {/* Tags row */}
        <div className="flex items-center gap-2 flex-wrap">
          {post.category && (
            <span className="flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
              <Tag className="w-3 h-3" />
              {post.category}
            </span>
          )}
          {post.region && (
            <span className="flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {post.region}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending || !user}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
              liked ? "text-red-500" : "text-muted-foreground hover:text-red-400"
            }`}
            data-testid={`like-btn-${post.id}`}
          >
            <Heart className={`w-4 h-4 transition-all ${liked ? "fill-red-500 scale-110" : ""}`} />
            <span>{count}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto"
            data-testid={`share-btn-${post.id}`}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
