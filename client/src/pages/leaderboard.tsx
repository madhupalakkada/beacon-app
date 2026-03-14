import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, Star, TrendingUp, Users } from "lucide-react";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-sm"><Trophy className="w-4 h-4 text-yellow-900" /></div>;
  if (rank === 2) return <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center shadow-sm"><Medal className="w-4 h-4 text-gray-700" /></div>;
  if (rank === 3) return <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center shadow-sm"><Award className="w-4 h-4 text-amber-100" /></div>;
  return <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">#{rank}</div>;
}

export default function Leaderboard() {
  const { data: users, isLoading } = useQuery<any[]>({
    queryKey: ["/api/leaderboard"],
  });

  return (
    <div className="space-y-5" data-testid="leaderboard-page">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-yellow-400/20 via-amber-300/20 to-yellow-400/10 p-5 border border-yellow-400/20">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-yellow-400/20 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h1 className="font-bold text-base" data-testid="leaderboard-title">Top Smilers</h1>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              The most active gratitude sharers in our community.
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Members</p>
            <p className="font-bold text-sm">{users?.length ?? "—"}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Smiles</p>
            <p className="font-bold text-sm">{users?.reduce((s: number, u: any) => s + (u.postsCount ?? 0), 0) ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Leaderboard list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl border border-border p-4 flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="w-12 h-5 rounded-full" />
            </div>
          ))}
        </div>
      ) : users && users.length > 0 ? (
        <div className="space-y-3">
          {users.map((user: any, idx: number) => (
            <div
              key={user.id}
              className={`rounded-xl border p-4 flex items-center gap-3 transition-colors ${
                idx === 0
                  ? "border-yellow-400/40 bg-yellow-400/5"
                  : idx === 1
                  ? "border-gray-300/40 bg-gray-100/5"
                  : idx === 2
                  ? "border-amber-600/40 bg-amber-600/5"
                  : "border-border"
              }`}
              data-testid={`leaderboard-row-${idx}`}
            >
              <RankBadge rank={idx + 1} />

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary font-bold text-sm">
                    {(user.displayName?.[0] ?? "?").toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{user.displayName}</p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>

              {/* Score */}
              <div className="flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full shrink-0">
                <Star className="w-3 h-3 text-primary fill-primary" />
                <span className="text-xs font-bold text-primary">{user.postsCount ?? 0}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No members yet. Be the first to share a smile!</p>
        </div>
      )}
    </div>
  );
}
