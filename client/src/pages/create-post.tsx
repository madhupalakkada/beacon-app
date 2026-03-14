import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Camera, Sparkles, Send, MapPin, X, Image } from "lucide-react";

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1517242027094-631f8c218a0f?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=600&h=400&fit=crop",
];

export default function CreatePost() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [story, setStory] = useState("");
  const [gratitudeReason, setGratitudeReason] = useState("");
  const [category, setCategory] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [region, setRegion] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image to max 800px wide, JPEG quality 0.7 (~50-150KB output)
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const maxW = 800;
        const maxH = 600;
        let w = img.width;
        let h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    try {
      const compressed = await compressImage(file);
      setUploadedPreview(compressed);
      setSelectedImage(compressed);
    } catch {
      toast({ title: "Error", description: "Failed to process image. Please try another.", variant: "destructive" });
    }
  };

  const clearUpload = () => {
    setUploadedPreview(null);
    setSelectedImage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const imageUrl = selectedImage || SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)];
      const res = await apiRequest("POST", "/api/posts", {
        userId: user?.id ?? "",
        imageUrl,
        story,
        gratitudeReason,
        category,
        createdAt: new Date().toISOString(),
        region: region.trim() || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Smile shared", description: "Your gratitude story is now live." });
      navigate("/");
    },
    onError: () => {
      toast({ title: "Error", description: "Could not create post. Please try again.", variant: "destructive" });
    },
  });

  const canSubmit = story.trim().length > 0 && gratitudeReason.trim().length > 0 && category.length > 0;

  return (
    <div className="space-y-5" data-testid="create-post-page">
      <div>
        <h1 className="font-bold text-base" data-testid="create-title">Share your smile</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Post a photo of your smile and tell the world what made you grateful today.
        </p>
      </div>

      <Card className="p-5 space-y-5 border border-border/60">
        {/* Photo upload / selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Your photo</Label>

          {/* Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileChange}
            className="hidden"
            data-testid="file-input"
          />

          {uploadedPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-primary/20">
              <img src={uploadedPreview} alt="Your photo" className="w-full aspect-[3/2] object-cover" />
              <button
                onClick={clearUpload}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                data-testid="clear-upload"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[2/1] rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
              data-testid="upload-trigger"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary">Take a selfie or upload photo</span>
              <span className="text-xs text-muted-foreground">Tap to open camera or gallery</span>
            </button>
          )}

          {/* Or pick a sample */}
          {!uploadedPreview && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Image className="w-3 h-3" />
                Or choose a sample photo:
              </p>
              <div className="grid grid-cols-6 gap-1.5">
                {SAMPLE_IMAGES.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === img ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-border"
                    }`}
                    data-testid={`photo-option-${i}`}
                  >
                    <img src={img} alt={`Option ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Story */}
        <div className="space-y-2">
          <Label htmlFor="story" className="text-sm font-medium">Your gratitude story</Label>
          <Textarea
            id="story"
            placeholder="What happened today that made you smile? Share your story..."
            value={story}
            onChange={(e) => setStory(e.target.value)}
            className="min-h-[100px] resize-none"
            data-testid="input-story"
          />
        </div>

        {/* Gratitude reason */}
        <div className="space-y-2">
          <Label htmlFor="gratitude" className="text-sm font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            What are you grateful for?
          </Label>
          <Input
            id="gratitude"
            placeholder="e.g., Grateful for my supportive friends"
            value={gratitudeReason}
            onChange={(e) => setGratitudeReason(e.target.value)}
            data-testid="input-gratitude"
          />
        </div>

        {/* Category + Location in a row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Choose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Family">Family</SelectItem>
                <SelectItem value="Nature">Nature</SelectItem>
                <SelectItem value="Friendship">Friendship</SelectItem>
                <SelectItem value="Career">Career</SelectItem>
                <SelectItem value="Wellness">Wellness</SelectItem>
                <SelectItem value="Kindness">Kindness</SelectItem>
                <SelectItem value="Community">Community</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="region" className="text-sm font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              Location
            </Label>
            <Input
              id="region"
              placeholder="e.g., Toronto"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              data-testid="input-region"
            />
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!canSubmit || createMutation.isPending}
          className="w-full gap-2"
          data-testid="submit-post"
        >
          <Send className="w-4 h-4" />
          {createMutation.isPending ? "Sharing..." : "Share your smile"}
        </Button>
      </Card>

      {/* AI verification note */}
      <div className="rounded-xl bg-accent/50 border border-accent p-4">
        <p className="text-xs text-accent-foreground leading-relaxed">
          <strong>AI Verification:</strong> In the full version of Beacon, our AI will verify that your photo contains a genuine smile to maintain the authenticity and positivity of our community.
        </p>
      </div>
    </div>
  );
}