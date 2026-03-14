import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Heart, Gift, MapPin, Calendar, Pencil, X, Check } from "lucide-react";
import PostCard from "@/components/post-card";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function Profile() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const isOwnProfile = currentUser?.id === userId;

  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");

  const { data, isLoading } = useQuery<{ user: any; posts: any[] }>({
    queryKey: ["/api/users", userId],
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: { bio?: string; location?: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
      setEditing(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Could not update profile.", variant: "destructive" });
    },
  });

  const startEditing = () => {
    setEditBio(data?.user?.bio || "");
    setEditLocation(data?.user?.location || "");
    setEditing(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="profile-loading">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-8" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12" data-testid="profile-not-found">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const { user, posts } = data;

  return (
    <div className="space-y-6" data-testid="profile-page">
      {/* Profile header */}
      <Card className="p-6 border border-border/60 text-center relative">
        {isOwnProfile && !editing && (
          <button
            onClick={startEditing}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            data-testid="edit-profile-btn"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}

        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl mx-auto" data-testid="profile-avatar">
          {getInitials(user.displayName)}
        </div>
        <h1 className="font-bold text-lg mt-4" data-testid="profile-name">{user.displayName}</h1>
        <p className="text-sm text-muted-foreground">@{user.username}</p>

        {editing ? (
          <div className="mt-4 space-y-3 max-w-xs mx-auto text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Bio</label>
              <Textarea
                placeholder="Tell others about yourself..."
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="min-h-[60px] resize-none text-sm"
                data-testid="edit-bio"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Location
              </label>
              <Input
                placeholder="Your city or region"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="text-sm"
                data-testid="edit-location"
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
                className="gap-1 text-xs"
                data-testid="cancel-edit"
              >
                <X className="w-3 h-3" /> Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => updateMutation.mutate({ bio: editBio.trim() || null, location: editLocation.trim() || null } as any)}
                disabled={updateMutation.isPending}
                className="gap-1 text-xs"
                data-testid="save-edit"
              >
                <Check className="w-3 h-3" /> {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {user.bio && (
              <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto" data-testid="profile-bio">{user.bio}</p>
            )}
            {user.location && (
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-2">
                <MapPin className="w-3 h-3" />
                <span data-testid="profile-location">{user.location}</span>
              </div>
            )}
          </>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-primary">
              <Heart className="w-4 h-4" />
              {user.totalSmiles ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Smiles</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-amber-600 dark:text-amber-400">
              <Flame className="w-4 h-4" />
              {user.smileStreak ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Day Streak</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
              <Gift className="w-4 h-4" />
              {user.tipsReceived ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Tips</p>
          </div>
        </div>
      </Card>

      {/* Achievements */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Achievements</h2>
        <div className="flex gap-2 flex-wrap">
          {(user.smileStreak ?? 0) >= 7 && (
            <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <Flame className="w-3 h-3" /> 7-Day Streak
            </Badge>
          )}
          {(user.smileStreak ?? 0) >= 14 && (
            <Badge variant="secondary" className="gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
              <Flame className="w-3 h-3" /> 14-Day Streak
            </Badge>
          )}
          {(user.smileStreak ?? 0) >= 30 && (
            <Badge variant="secondary" className="gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              <Flame className="w-3 h-3" /> 30-Day Streak
            </Badge>
          )}
          {(user.totalSmiles ?? 0) >= 50 && (
            <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <Heart className="w-3 h-3" /> 50+ Smiles
            </Badge>
          )}
          {(user.totalSmiles ?? 0) >= 100 && (
            <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <Heart className="w-3 h-3" /> Century Smiler
            </Badge>
          )}
          {(user.tipsReceived ?? 0) >= 10 && (
            <Badge variant="secondary" className="gap-1 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              <Gift className="w-3 h-3" /> Appreciated
            </Badge>
          )}
          {posts.length === 0 && (user.smileStreak ?? 0) < 7 && (
            <p className="text-xs text-muted-foreground">Keep sharing to earn achievements.</p>
          )}
        </div>
      </div>

      {/* Posts */}
      <div>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          Gratitude Stories ({posts.length})
        </h2>
        {posts.length === 0 ? (
          <Card className="p-8 border border-border/60 text-center">
            <p className="text-sm text-muted-foreground">No stories shared yet.</p>
          </Card>
        ) : (
          <div className="space-y-5">
            {posts.map((post: any) => (
              <PostCard key={post.id} post={{ ...post, user: { id: user.id, displayName: user.displayName, username: user.username, avatar: user.avatar, smileStreak: user.smileStreak } }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}