import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Star, ExternalLink, Search } from "lucide-react";

interface AmazonProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  rating: number;
  reviews: number;
  imageUrl: string;
  category: string;
  amazonUrl: string;
}

const CATEGORIES = ["All", "Journals", "Meditation", "Wellness"];

function formatReviews(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${
              i <= full
                ? "fill-amber-400 text-amber-400"
                : i === full + 1 && hasHalf
                ? "fill-amber-400/50 text-amber-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground">{rating}</span>
    </div>
  );
}

export default function Shop() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const { data: products, isLoading } = useQuery<AmazonProduct[]>({
    queryKey: ["/api/products"],
  });

  const filtered = products?.filter(
    (p) => activeCategory === "All" || p.category === activeCategory
  );

  const handleImageError = (id: string) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="space-y-5" data-testid="shop-page">
      {/* Header */}
      <div>
        <h1 className="font-bold text-lg flex items-center gap-2" data-testid="shop-title">
          <ShoppingBag className="w-5 h-5 text-primary" />
          Mindfulness Shop
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Curated mindfulness products from Amazon. Tap any product to buy it directly.
        </p>
      </div>

      {/* Powered by Amazon badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FF9900]/10 border border-[#FF9900]/20">
        <svg viewBox="0 0 603 182" className="w-16 h-5 shrink-0" aria-label="Amazon">
          <path fill="#FF9900" d="M374.01 142.09c-34.6 25.53-84.74 39.12-127.9 39.12-60.55 0-115.1-22.39-156.38-59.63-3.24-2.93-.34-6.92 3.55-4.64 44.54 25.89 99.61 41.5 156.5 41.5 38.37 0 80.6-7.95 119.44-24.45 5.86-2.49 10.77 3.85 4.79 8.1z"/>
          <path fill="#FF9900" d="M387.7 126.59c-4.41-5.66-29.24-2.68-40.37-1.35-3.39.41-3.91-2.54-.85-4.66 19.76-13.9 52.16-9.89 55.94-5.23 3.78 4.68-.99 37.07-19.53 52.52-2.85 2.38-5.57 1.11-4.3-2.04 4.18-10.43 13.52-33.58 9.11-39.24z"/>
          <path fill="#232F3E" d="M348.09 23.13V7.15c0-2.42 1.84-4.05 4.05-4.05h71.64c2.3 0 4.14 1.67 4.14 4.05v13.68c-.02 2.3-1.98 5.31-5.44 10.12l-37.11 52.99c13.78-.34 28.34 1.72 40.83 8.78 2.82 1.6 3.58 3.93 3.8 6.23v17.06c0 2.34-2.58 5.06-5.29 3.65-22.11-11.59-51.48-12.85-75.95.14-2.49 1.33-5.1-1.35-5.1-3.69V99.55c0-2.62.04-7.09 2.66-11.08l42.98-61.64h-37.41c-2.3 0-4.14-1.63-4.14-4.01h.34zM124.83 130.42h-21.79c-2.08-.15-3.74-1.72-3.89-3.71V7.37c0-2.24 1.87-4.03 4.18-4.03h20.31c2.11.09 3.8 1.72 3.95 3.74v15.93h.41c5.29-15.14 15.24-22.19 28.62-22.19 13.59 0 22.1 7.05 28.19 22.19 5.27-15.14 17.22-22.19 30.01-22.19 9.11 0 19.06 3.76 25.14 12.21 6.89 9.37 5.48 23 5.48 34.95l-.02 78.67c0 2.24-1.87 4.05-4.18 4.05h-21.75c-2.17-.15-3.91-1.89-3.91-4.05V55.77c0-4.7.41-16.45-.61-20.88-1.63-7.42-6.5-9.51-12.79-9.51-5.29 0-10.79 3.53-13.04 9.17-2.24 5.64-2.04 15.07-2.04 21.22v71.02c0 2.24-1.87 4.05-4.18 4.05h-21.75c-2.19-.15-3.91-1.89-3.91-4.05l-.02-71.02c0-12.44 2.04-30.73-13.38-30.73-15.63 0-15.03 17.85-15.03 30.73v71.02c0 2.24-1.87 4.05-4.18 4.05h-.02zM465.05.82c32.36 0 49.87 27.79 49.87 63.12 0 34.14-19.34 61.23-49.87 61.23-31.75 0-49.05-27.79-49.05-62.42C416 28.27 433.52.82 465.05.82zm.2 22.96c-16.05 0-17.06 21.86-17.06 35.49 0 13.65-.2 42.83 16.85 42.83 16.85 0 17.66-23.53 17.66-37.87 0-9.44-.41-20.72-3.25-29.76-2.45-7.86-7.3-10.69-14.2-10.69zM551.27 130.42h-21.7c-2.17-.15-3.91-1.89-3.91-4.05l-.02-119.4c.19-2.09 1.98-3.74 4.18-3.74h20.21c1.91.09 3.48 1.41 3.89 3.18v18.26h.41c6.09-16.13 14.62-23.85 29.64-23.85 9.72 0 19.22 3.52 25.33 13.19C615.59 24 615.59 38.1 615.59 50v77.34c-.26 1.98-2.04 3.58-4.18 3.58h-21.86c-1.98-.15-3.6-1.67-3.82-3.58V54.26c0-12.21 1.42-30.07-13.59-30.07-5.29 0-10.16 3.53-12.6 8.93-3.05 6.83-3.46 13.63-3.46 21.14v72.11c-.02 2.24-1.91 4.05-4.22 4.05h.41zM303.7 74.7c0 8.46.2 15.51-4.07 23.03-3.46 6.11-8.95 9.87-15.03 9.87-8.34 0-13.22-6.35-13.22-15.74 0-18.53 16.61-21.9 32.32-21.9v4.74zm21.92 53c-1.44 1.28-3.52 1.37-5.15.51-7.24-6.01-8.53-8.79-12.5-14.52-11.95 12.18-20.42 15.83-35.9 15.83-18.34 0-32.57-11.31-32.57-33.94 0-17.67 9.57-29.7 23.19-35.58 11.79-5.19 28.24-6.11 40.83-7.55v-2.82c0-5.19.41-11.31-2.65-15.8-2.65-4.03-7.73-5.68-12.21-5.68-8.3 0-15.69 4.26-17.5 13.08-.37 1.96-1.81 3.89-3.78 3.99l-21.12-2.27c-1.78-.4-3.76-1.83-3.25-4.55C249.52 8.46 277.9.82 303.7.82c13.19 0 30.42 3.52 40.83 13.52 13.19 12.33 11.93 28.78 11.93 46.68v42.29c0 12.72 5.27 18.29 10.23 25.17 1.74 2.45 2.13 5.39-.11 7.21-5.6 4.68-15.56 13.38-21.02 18.26l-.64-.25z"/>
          <path fill="#232F3E" d="M52.58 74.7c0 8.46.2 15.51-4.07 23.03-3.46 6.11-8.93 9.87-15.03 9.87-8.34 0-13.2-6.35-13.2-15.74 0-18.53 16.61-21.9 32.3-21.9v4.74zm21.94 53c-1.44 1.28-3.52 1.37-5.15.51-7.24-6.01-8.55-8.79-12.5-14.52C44.91 125.87 36.44 129.52 21 129.52 2.66 129.52-11.57 118.21-11.57 95.58c0-17.67 9.57-29.7 23.19-35.58 11.79-5.19 28.24-6.11 40.83-7.55v-2.82c0-5.19.41-11.31-2.65-15.8C47.15 29.8 42.07 28.15 37.59 28.15c-8.3 0-15.69 4.26-17.5 13.08-.37 1.96-1.81 3.89-3.78 3.99L-4.82 42.95c-1.78-.4-3.76-1.83-3.25-4.55C-1.58 8.46 26.8.82 52.58.82c13.19 0 30.42 3.52 40.83 13.52 13.19 12.33 11.93 28.78 11.93 46.68v42.29c0 12.72 5.27 18.29 10.23 25.17 1.74 2.45 2.13 5.39-.11 7.21-5.6 4.68-15.56 13.38-21.02 18.26l-.64-.25-.28.01z" transform="translate(11.57)"/>
        </svg>
        <span className="text-xs text-[#232F3E] dark:text-amber-200 font-medium">
          Products from Amazon — click to buy directly
        </span>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            data-testid={`shop-filter-${cat.toLowerCase()}`}
          >
            {cat}
            {cat !== "All" && products && (
              <span className="ml-1 opacity-70">
                ({products.filter((p) => p.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Products grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered?.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden border border-border/60 group cursor-pointer hover:shadow-md transition-shadow duration-200"
              data-testid={`product-${product.id}`}
              onClick={() => window.open(product.amazonUrl, "_blank", "noopener,noreferrer")}
            >
              <div className="aspect-square bg-white relative overflow-hidden">
                {imgErrors[product.id] ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <ShoppingBag className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                ) : (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={() => handleImageError(product.id)}
                  />
                )}
                <Badge
                  variant="secondary"
                  className="absolute top-2 left-2 text-[10px] bg-background/80 backdrop-blur-sm"
                >
                  {product.category}
                </Badge>
              </div>
              <div className="p-3 space-y-1.5">
                <h3 className="text-sm font-semibold leading-tight line-clamp-2" data-testid={`product-name-${product.id}`}>
                  {product.name}
                </h3>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
                <StarRating rating={product.rating} />
                <p className="text-[10px] text-muted-foreground">
                  {formatReviews(product.reviews)} ratings
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-bold text-primary" data-testid={`product-price-${product.id}`}>
                    {product.price}
                  </span>
                  <Button
                    size="sm"
                    className="h-7 text-[11px] px-2.5 gap-1 bg-[#FF9900] hover:bg-[#e88b00] text-white border-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(product.amazonUrl, "_blank", "noopener,noreferrer");
                    }}
                    data-testid={`buy-amazon-${product.id}`}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Buy
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Browse more on Amazon */}
      <Card className="p-4 border border-[#FF9900]/30 bg-[#FF9900]/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FF9900]/15 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5 text-[#FF9900]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Browse more on Amazon</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Explore thousands of mindfulness, meditation, and wellness products.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 text-xs border-[#FF9900]/40 hover:bg-[#FF9900]/10"
            onClick={() =>
              window.open(
                "https://www.amazon.ca/s?k=mindfulness+meditation+wellness+products",
                "_blank",
                "noopener,noreferrer"
              )
            }
            data-testid="browse-amazon"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Amazon
          </Button>
        </div>
      </Card>
    </div>
  );
}