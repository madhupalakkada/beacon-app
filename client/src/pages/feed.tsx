import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PostCard from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Smile, Sparkles, PlusCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const CATEGORIES = ["All", "Family", "Nature", "Friendship", "Career", "Wellness", "Kindness", "Community"];

export default function Feed() {
  const [activeFilter, setActiveFilter] = useState("All");

  const { data: posts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/posts"],
  });

  const filteredPosts = activeFilter === "All"
    ? posts
    : posts?.filter((p: any) => p.category === activeFilter);

  return (
    <div className="space-y-5" data-testid="feed-page">
      {/* Hero banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/30 to-primary/5 p-5 border border-primary/10">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
            <Smile className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-base" data-testid="feed-title">
              Share your smile today
            </h1>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Every story of gratitude makes the world a little brighter.
            </p>
          </div>
          <Link href="/create">
            <Button size="sm" className="gap-1.5 text-xs shrink-0" data-testid="cta-create">
              <PlusCircle className="w-3.5 h-3.5" />
              Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              cat === activeFilter
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            data-testid={`filter-${cat.toLowerCase()}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts */}
      {isLoading ? (
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              <Skeleton className="h-14 m-4" />
              <Skeleton className="aspect-[3/2]" />
              <Skeleton className="h-20 m-4" />
            </div>
          ))}
        </div>
      ) : filteredPosts && filteredPosts.length > 0 ? (
        <div className="space-y-5">
          {filteredPosts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="text-center py-16 px-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h2 className="font-semibold text-base mb-2">
            {activeFilter !== "All" ? `No ${activeFilter} stories yet` : "Be the first to share"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6 leading-relaxed">
            {activeFilter !== "All"
              ? "Try a different category or create the first story in this one."
              : "Your gratitude story could be the spark that brightens someone's day. Share your smile and start the wave."}
          </p>
          <Link href="/create">
            <Button className="gap-2" data-testid="empty-cta-create">
              <PlusCircle className="w-4 h-4" />
              Share your first smile
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}