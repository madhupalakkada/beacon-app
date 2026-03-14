import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Star, Coins, CheckCircle, Lock, Sparkles, Gift } from "lucide-react";

export default function Shop() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const { data: items, isLoading } = useQuery<any[]>({
    queryKey: ["/api/shop/items"],
  });

  const { data: userRedemptions } = useQuery<any[]>({
    queryKey: ["/api/shop/redemptions", user?.id],
    enabled: !!user?.id,
  });

  const redeemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await apiRequest("POST", "/api/shop/redeem", { userId: user?.id, itemId });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/redemptions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Redeemed!", description: data.message || "Reward unlocked successfully." });
      setRedeeming(null);
    },
    onError: (err: any) => {
      const msg = err?.message || "Could not redeem this reward.";
      toast({ title: "Redemption failed", description: msg.replace(/^\d+:\s*/, ""), variant: "destructive" });
      setRedeeming(null);
    },
  });

  const redeemedIds = new Set((userRedemptions ?? []).map((r: any) => r.itemId));
  const userCoins = (user as any)?.coins ?? 0;

  return (
    <div className="space-y-5" data-testid="shop-page">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-400/15 to-violet-500/5 p-5 border border-violet-400/20">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-violet-500/15 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-base" data-testid="shop-title">Smile Shop</h1>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Redeem your gratitude coins for exclusive rewards.
            </p>
          </div>
          {/* Coin balance */}
          <div className="flex items-center gap-1.5 bg-yellow-400/15 border border-yellow-400/30 px-3 py-1.5 rounded-full shrink-0">
            <Coins className="w-3.5 h-3.5 text-yellow-600" />
            <span className="text-xs font-bold text-yellow-700" data-testid="coin-balance">{userCoins}</span>
          </div>
        </div>
      </div>

      {/* How to earn */}
      <div className="rounded-xl bg-accent/50 border border-accent p-4">
        <p className="text-xs text-accent-foreground leading-relaxed">
          <strong className="flex items-center gap-1 mb-1"><Sparkles className="w-3 h-3" /> How to earn coins:</strong>
          Share a smile post (+10 coins) · Receive a like (+2 coins) · Daily streak (+5 coins)
        </p>
      </div>

      {/* Shop grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              <Skeleton className="aspect-square" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item: any) => {
            const isRedeemed = redeemedIds.has(item.id);
            const canAfford = userCoins >= item.coinCost;
            const isRedeeming = redeeming === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-xl border overflow-hidden transition-all ${
                  isRedeemed ? "border-green-400/40 bg-green-50/50 dark:bg-green-950/20" : "border-border"
                }`}
                data-testid={`shop-item-${item.id}`}
              >
                {/* Image */}
                <div className="aspect-square bg-muted relative">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gift className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                  )}
                  {isRedeemed && (
                    <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <p className="font-semibold text-sm leading-tight">{item.name}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>

                  {/* Cost + action */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-bold">{item.coinCost}</span>
                    </div>
                    {isRedeemed ? (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Owned
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant={canAfford ? "default" : "outline"}
                        disabled={!canAfford || isRedeeming}
                        onClick={() => {
                          setRedeeming(item.id);
                          redeemMutation.mutate(item.id);
                        }}
                        className="h-7 text-xs px-2.5"
                        data-testid={`redeem-btn-${item.id}`}
                      >
                        {isRedeeming ? (
                          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : !canAfford ? (
                          <><Lock className="w-3 h-3 mr-1" />Need more</>
                        ) : (
                          "Redeem"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No rewards available yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
