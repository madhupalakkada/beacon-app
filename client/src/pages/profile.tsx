import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import PostCard from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, LogOut, Camera, Star, Smile, Coins, Edit3, Check, X } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");

  const { data: posts, isLoading: postsLoading } = useQuery<any[]>({
    queryKey: ["/api/posts", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/posts?userId=${user?.id}`);
      return res.json();
    },
    enabled: !!user?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { displayName?: string; bio?: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
      setEditingName(false);
      setEditingBio(false);
    },
    onError: (err: any) => {
      toast({ title: "Update failed", description: err?.message || "Something went wrong.", variant: "destructive" });
    },
  });

  const u = user as any;

  return (
    <div className="space-y-5" data-testid="profile-page">
      {/* Profile header */}
      <div className="rounded-2xl border border-border p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-primary/10 overflow-hidden">
              {u?.avatarUrl ? (
                <img src={u.avatarUrl} alt={u.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-7 h-7 text-primary" />
                </div>
              )}
            </div>
            <button
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm"
              data-testid="avatar-edit-btn"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>

          {/* Name / username / bio */}
          <div className="flex-1 min-w-0">
            {/* Display name */}
            {editingName ? (
              <div className="flex items-center gap-2 mb-1">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-7 text-sm font-semibold px-2"
                  autoFocus
                  data-testid="input-display-name"
                />
                <button
                  onClick={() => updateProfileMutation.mutate({ displayName: newName.trim() })}
                  className="text-primary"
                  disabled={!newName.trim()}
                  data-testid="save-name-btn"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingName(false)} className="text-muted-foreground" data-testid="cancel-name-btn">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-base truncate">{u?.displayName}</p>
                <button
                  onClick={() => { setNewName(u?.displayName ?? ""); setEditingName(true); }}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  data-testid="edit-name-btn"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">@{u?.username}</p>

            {/* Bio */}
            {editingBio ? (
              <div className="mt-2 space-y-1">
                <Input
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="Add a bio..."
                  className="h-7 text-xs px-2"
                  autoFocus
                  data-testid="input-bio"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => updateProfileMutation.mutate({ bio: newBio.trim() })}
                    className="text-xs text-primary"
                    data-testid="save-bio-btn"
                  >
                    Save
                  </button>
                  <button onClick={() => setEditingBio(false)} className="text-xs text-muted-foreground" data-testid="cancel-bio-btn">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex items-start gap-1">
                <p className="text-xs text-muted-foreground">{u?.bio || "No bio yet"}</p>
                <button
                  onClick={() => { setNewBio(u?.bio ?? ""); setEditingBio(true); }}
                  className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
                  data-testid="edit-bio-btn"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Smile className="w-3.5 h-3.5 text-primary" />
              <span className="font-bold text-base">{posts?.length ?? 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Smiles</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-base">{u?.likesReceived ?? 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Likes</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Coins className="w-3.5 h-3.5 text-yellow-600" />
              <span className="font-bold text-base">{u?.coins ?? 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Coins</p>
          </div>
        </div>
      </div>

      {/* Settings row */}
      <div className="flex gap-3">
        <Button variant="outline" size="sm" className="flex-1 gap-2 text-xs" data-testid="settings-btn">
          <Settings className="w-3.5 h-3.5" />
          Settings
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-2 text-xs text-destructive hover:text-destructive"
          onClick={logout}
          data-testid="logout-btn"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </Button>
      </div>

      {/* My posts */}
      <div className="space-y-4">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Smile className="w-4 h-4 text-primary" />
          My Smiles
        </h2>
        {postsLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-border overflow-hidden">
                <Skeleton className="h-14 m-4" />
                <Skeleton className="aspect-[3/2]" />
                <Skeleton className="h-20 m-4" />
              </div>
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Smile className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No smiles shared yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
