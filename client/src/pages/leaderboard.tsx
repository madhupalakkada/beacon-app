import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Flame, Heart, Award, MapPin, ImageOff } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function getMedalColor(rank: number): string {
  if (rank === 0) return "text-amber-500";
  if (rank === 1) return "text-gray-400";
  if (rank === 2) return "text-amber-700";
  return "text-muted-foreground";
}

function getMedalBg(rank: number): string {
  if (rank === 0) return "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800";
  if (rank === 1) return "bg-gray-50 border-gray-200 dark:bg-gray-900/30 dark:border-gray-700";
  if (rank === 2) return "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800";
  return "bg-card border-border/60";
}

export default function Leaderboard() {
  const { data: users, isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/leaderboard"],
  });

  const { data: topPosts, isLoading: postsLoading } = useQuery<any[]>({
    queryKey: ["/api/posts/weekly-top"],
  });

  return (
    <div className="space-y-5" data-testid="leaderboard-page">
      <div>
        <h1 className="font-bold text-base flex items-center gap-2" data-testid="leaderboard-title">
          <Trophy className="w-5 h-5 text-primary" />
          Leaderboard
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Celebrating the most grateful and positive members of our community.
        </p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" data-testid="tab-users">Top Smilers</TabsTrigger>
          <TabsTrigger value="posts" data-testid="tab-posts">Best Stories</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4 space-y-3">
          {usersLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))
          ) : users && users.length > 0 ? (
            users.map((user: any, index: number) => (
              <Link key={user.id} href={`/profile/${user.id}`}>
                <Card
                  className={`p-4 border cursor-pointer hover:shadow-md transition-shadow ${getMedalBg(index)}`}
                  data-testid={`leaderboard-user-${user.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`text-xl font-bold w-8 text-center ${getMedalColor(index)}`}>
                      {index < 3 ? (
                        <Award className="w-6 h-6 mx-auto" />
                      ) : (
                        <span className="text-sm">{index + 1}</span>
                      )}
                    </div>
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {getInitials(user.displayName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{user.displayName}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {user.location && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {user.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                        <Heart className="w-3.5 h-3.5" />
                        {user.totalSmiles}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                        <Flame className="w-3 h-3" />
                        {user.smileStreak}d
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No smilers yet. Be the first to post.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="posts" className="mt-4 space-y-3">
          {postsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          ) : topPosts && topPosts.length > 0 ? (
            topPosts.map((post: any, index: number) => (
              <TopPostCard key={post.id} post={post} index={index} />
            ))
          ) : (
            <div className="text-center py-12">
              <Heart className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No stories yet. Share the first one.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Weekly competition info */}
      <Card className="p-4 border border-primary/20 bg-primary/5">
        <div className="flex items-start gap-3">
          <Trophy className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Weekly Smile Competition</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              The most liked gratitude stories are featured weekly at district, city, and country levels. Winners receive recognition badges and sponsored prizes from our partners.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function TopPostCard({ post, index }: { post: any; index: number }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Card className={`p-4 border ${getMedalBg(index)}`} data-testid={`top-post-${post.id}`}>
      <div className="flex items-start gap-3">
        <div className={`text-lg font-bold w-8 text-center pt-1 ${getMedalColor(index)}`}>
          {index < 3 ? <Award className="w-5 h-5 mx-auto" /> : <span className="text-sm">{index + 1}</span>}
        </div>
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
            <span className="flex items-center gap-0.5">
              <Heart className="w-3 h-3 text-red-400" />
              {post.likes}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}