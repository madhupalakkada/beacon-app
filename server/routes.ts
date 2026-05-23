import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage, SupabaseStorage, type Post, type Profile } from "./storage";
import { supabase, supabaseAdmin, supabaseUrl, supabaseAnonKey } from "./supabase";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

// Node 20 lacks native WebSocket; Supabase Realtime needs an explicit transport.
const realtimeTransport = { realtime: { transport: ws as any } };

// ─── Helpers ─────────────────────────────────────────────

// Create a user-scoped Supabase client for write operations that respect RLS
function getUserClient(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    ...realtimeTransport,
  });
}

// Get a storage instance that uses the user's auth token (for RLS)
function getUserStorage(req: Request): SupabaseStorage {
  const client = getUserClient(req);
  if (client) {
    return new SupabaseStorage(client);
  }
  return storage as SupabaseStorage;
}

// Convert snake_case DB post → camelCase for frontend
function normalizePost(p: Post) {
  return {
    id: p.id,
    userId: p.user_id,
    imageUrl: p.image_url,
    story: p.story,
    gratitudeReason: p.gratitude_reason,
    category: p.category,
    likes: p.likes,
    tips: p.tips,
    isVerified: p.is_verified,
    createdAt: p.created_at,
    region: p.region,
  };
}

// Convert snake_case DB profile → camelCase for frontend
function normalizeProfile(p: Profile) {
  return {
    id: p.id,
    username: p.username,
    displayName: p.display_name,
    email: p.email,
    avatar: p.avatar,
    bio: p.bio,
    location: p.location,
    smileStreak: p.smile_streak,
    totalSmiles: p.total_smiles,
    tipsReceived: p.tips_received,
  };
}

// Get authenticated user from the Bearer token
async function getAuthUser(req: any): Promise<{ id: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    ...realtimeTransport,
  });
  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id };
}

// ─── Routes ──────────────────────────────────────────────
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ═══ AUTH ══════════════════════════════════════════════

  // Register (Supabase Auth + create profile row)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, displayName, username } = req.body;
      if (!email || !password || !displayName || !username) {
        return res.status(400).json({ error: "All fields are required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      // Check duplicates
      const existingUsername = await storage.getProfileByUsername(username.toLowerCase());
      if (existingUsername) {
        return res.status(409).json({ error: "This username is already taken" });
      }
      const existingEmail = await storage.getProfileByEmail(email.toLowerCase());
      if (existingEmail) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }

      // Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
      });

      if (authError) {
        if (authError.message?.includes("already registered")) {
          return res.status(409).json({ error: "An account with this email already exists" });
        }
        return res.status(400).json({ error: authError.message });
      }
      if (!authData.user) {
        return res.status(500).json({ error: "Registration failed" });
      }

      // Create profile row
      const profile = await storage.createProfile({
        id: authData.user.id,
        username: username.toLowerCase(),
        display_name: displayName,
        email: email.toLowerCase(),
        avatar: null,
        bio: null,
        location: null,
      });

      // Get session token — auto-confirm should be enabled
      if (!authData.session) {
        // Try signing in directly (works when auto-confirm is on)
        const { data: loginData } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password,
        });
        if (loginData?.session) {
          return res.json({
            user: normalizeProfile(profile),
            token: loginData.session.access_token,
          });
        }
        // Account created but email confirmation needed
        return res.json({
          user: normalizeProfile(profile),
          token: "",
          needsConfirmation: true,
        });
      }

      res.json({
        user: normalizeProfile(profile),
        token: authData.session.access_token,
      });
    } catch (err: any) {
      console.error("Registration error:", err);
      res.status(500).json({ error: err.message || "Registration failed" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (authError || !authData.user || !authData.session) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const profile = await storage.getProfile(authData.user.id);
      if (!profile) {
        return res.status(401).json({ error: "Profile not found. Please register first." });
      }

      res.json({
        user: normalizeProfile(profile),
        token: authData.session.access_token,
      });
    } catch (err: any) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Get current user from token
  app.get("/api/auth/me", async (req, res) => {
    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ error: "Not authenticated" });
    const profile = await storage.getProfile(authUser.id);
    if (!profile) return res.status(401).json({ error: "Profile not found" });
    res.json({ user: normalizeProfile(profile) });
  });

  // Logout
  app.post("/api/auth/logout", async (_req, res) => {
    res.json({ ok: true });
  });

  // Verify email exists (forgot password step 1)
  app.post("/api/auth/verify-email", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    const profile = await storage.getProfileByEmail(email.toLowerCase());
    if (!profile) {
      return res.status(404).json({ error: "No account found with this email address" });
    }
    res.json({ exists: true, displayName: profile.display_name });
  });

  // Send password reset email (secure - requires user to verify via email)
  app.post("/api/auth/send-reset-email", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });

      // Check if account exists first
      const profile = await storage.getProfileByEmail(email.toLowerCase());
      if (!profile) {
        return res.status(404).json({ error: "No account found with this email address" });
      }

      // Send reset email via Supabase — user must click the link in their email
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
        redirectTo: `${req.headers.origin || 'http://localhost:5000'}/#/reset-password`,
      });
      if (error) {
        return res.status(500).json({ error: "Could not send reset email: " + error.message });
      }
      res.json({ ok: true, displayName: profile.display_name });
    } catch {
      res.status(500).json({ error: "Password reset failed" });
    }
  });

  // Update password (called after user verifies via email link)
  app.post("/api/auth/update-password", async (req, res) => {
    try {
      const { accessToken, refreshToken, newPassword } = req.body;
      if (!accessToken || !refreshToken || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      // updateUser requires an established session, not just a bearer header.
      // Build an isolated client and hydrate it with the recovery tokens via
      // setSession; then updateUser can read the session and apply the change.
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        ...realtimeTransport,
      });
      const { error: sessionError } = await userClient.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) {
        return res.status(400).json({ error: "Could not update password: " + sessionError.message });
      }
      const { error } = await userClient.auth.updateUser({ password: newPassword });
      if (error) {
        return res.status(400).json({ error: "Could not update password: " + error.message });
      }
      await userClient.auth.signOut();
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Password update failed" });
    }
  });

  // Google OAuth - initiate
  app.get("/api/auth/google", async (req, res) => {
    try {
      // Build the redirect URL based on the request origin
      const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, "") || `http://localhost:${process.env.PORT || 5000}`;
      const redirectTo = `${origin}/api/auth/google/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) return res.status(400).json({ error: error.message });
      res.json({ url: data.url });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Google auth failed" });
    }
  });

  // Google OAuth - callback (handles the redirect from Google/Supabase)
  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      // Supabase redirects with a hash fragment containing access_token
      // We serve a small HTML page that extracts the token and sends it to the app
      res.send(`<!DOCTYPE html>
<html><head><title>Signing in...</title></head>
<body>
<script>
  // Supabase puts tokens in the URL hash
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  if (accessToken) {
    // Post the token to the parent/opener or redirect with token
    window.location.href = '/#/google-callback?token=' + accessToken;
  } else {
    // Check query params as fallback
    const qp = new URLSearchParams(window.location.search);
    const code = qp.get('code');
    if (code) {
      window.location.href = '/#/google-callback?code=' + code;
    } else {
      document.body.innerHTML = '<p>Authentication failed. <a href="/">Go back</a></p>';
    }
  }
</script>
<p>Signing you in...</p>
</body></html>`);
    } catch {
      res.redirect("/#/");
    }
  });

  // Google OAuth - exchange token for user session
  app.post("/api/auth/google/token", async (req, res) => {
    try {
      const { accessToken } = req.body;
      if (!accessToken) return res.status(400).json({ error: "Token required" });

      // Verify the token with Supabase
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        ...realtimeTransport,
      });
      const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);
      if (userError || !userData.user) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const authUser = userData.user;
      // Check if profile exists
      let profile = await storage.getProfile(authUser.id);
      if (!profile) {
        // Create profile from Google data
        const email = authUser.email || "";
        const displayName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split("@")[0];
        const username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") + Math.floor(Math.random() * 1000);

        profile = await storage.createProfile({
          id: authUser.id,
          username,
          display_name: displayName,
          email,
          avatar: authUser.user_metadata?.avatar_url || null,
          bio: null,
          location: null,
        });
      }

      res.json({
        user: normalizeProfile(profile),
        token: accessToken,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Google auth failed" });
    }
  });

  // ═══ POSTS ═════════════════════════════════════════════

  // Get all posts (feed)
  app.get("/api/posts", async (_req, res) => {
    const posts = await storage.getPosts();
    const profiles = await storage.getAllProfiles();
    const profileMap = new Map(profiles.map(p => [p.id, p]));
    const enriched = posts.map(p => {
      const profile = profileMap.get(p.user_id);
      return {
        ...normalizePost(p),
        user: profile ? {
          id: profile.id,
          displayName: profile.display_name,
          username: profile.username,
          avatar: profile.avatar,
          smileStreak: profile.smile_streak,
        } : null,
      };
    });
    res.json(enriched);
  });

  // Get weekly top posts
  app.get("/api/posts/weekly-top", async (_req, res) => {
    const posts = await storage.getWeeklyTop(10);
    const profiles = await storage.getAllProfiles();
    const profileMap = new Map(profiles.map(p => [p.id, p]));
    const enriched = posts.map(p => {
      const profile = profileMap.get(p.user_id);
      return {
        ...normalizePost(p),
        user: profile ? {
          id: profile.id,
          displayName: profile.display_name,
          username: profile.username,
          avatar: profile.avatar,
        } : null,
      };
    });
    res.json(enriched);
  });

  // Create a post (uses user-scoped client for RLS)
  app.post("/api/posts", async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const { userId, imageUrl, story, gratitudeReason, category, createdAt, region } = req.body;
      const post = await userStorage.createPost({
        user_id: userId,
        image_url: imageUrl,
        story,
        gratitude_reason: gratitudeReason,
        category,
        created_at: createdAt || new Date().toISOString(),
        region: region || null,
      });
      res.json(normalizePost(post));
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to create post" });
    }
  });

  // Like a post (uses user-scoped client for RLS)
  app.post("/api/posts/:id/like", async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const post = await userStorage.likePost(req.params.id, req.body.userId);
      if (!post) return res.status(404).json({ error: "Post not found" });
      res.json(normalizePost(post));
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed" });
    }
  });

  // Tip a post (uses user-scoped client for RLS)
  app.post("/api/posts/:id/tip", async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const { fromUserId, toUserId, amount } = req.body;
      const post = await userStorage.tipPost(req.params.id, fromUserId, toUserId, amount);
      if (!post) return res.status(404).json({ error: "Post not found" });
      res.json(normalizePost(post));
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed" });
    }
  });

  // ═══ USERS ═════════════════════════════════════════════

  // Leaderboard
  app.get("/api/leaderboard", async (_req, res) => {
    const profiles = await storage.getTopProfiles(20);
    res.json(profiles.map(normalizeProfile));
  });

  // Get user profile + posts
  app.get("/api/users/:id", async (req, res) => {
    const profile = await storage.getProfile(req.params.id);
    if (!profile) return res.status(404).json({ error: "User not found" });
    const posts = await storage.getPostsByUser(req.params.id);
    res.json({
      user: normalizeProfile(profile),
      posts: posts.map(normalizePost),
    });
  });

  // Update profile (bio, location)
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const authUser = await getAuthUser(req);
      if (!authUser || authUser.id !== req.params.id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { bio, location } = req.body;
      const updates: any = {};
      if (bio !== undefined) updates.bio = bio;
      if (location !== undefined) updates.location = location;

      const userStorage = getUserStorage(req);
      const updated = await userStorage.updateProfile(req.params.id, updates);
      if (!updated) return res.status(404).json({ error: "User not found" });
      res.json({ user: normalizeProfile(updated) });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Update failed" });
    }
  });

  // ═══ PRODUCTS (Amazon Mindfulness Products) ═══════════

  app.get("/api/products", async (_req, res) => {
    const amazonProducts = [
      {
        id: "amz-1",
        name: "The Five Minute Journal",
        description: "Daily guided gratitude journal with morning & evening prompts. Hardcover, 6-month supply. #1 bestseller in self-help journals.",
        price: "CA$38.99",
        rating: 4.7,
        reviews: 18200,
        imageUrl: "https://www.intelligentchange.com/cdn/shop/products/4X5-1600x2000-Intelligent-Change-Five-Minute-Journal-Linen-1_0fd12c11-f576-4621-be36-5fcb307c925b.jpg?v=1671124315&width=400",
        category: "Journals",
        amazonUrl: "https://www.amazon.ca/dp/0991846206",
      },
      {
        id: "amz-2",
        name: "Good Days Start With Gratitude",
        description: "52-week gratitude journal with 3 daily prompts. Undated, portable 6×9 format. Budget-friendly and highly rated.",
        price: "CA$7.95",
        rating: 4.6,
        reviews: 12400,
        imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop",
        category: "Journals",
        amazonUrl: "https://www.amazon.ca/dp/1983200247",
      },
      {
        id: "amz-3",
        name: "Tibetan Singing Bowl Set",
        description: "Handcrafted 4-inch singing bowl with wooden mallet and cushion. Perfect for meditation, relaxation, and mindfulness practice.",
        price: "CA$27.99",
        rating: 4.5,
        reviews: 8900,
        imageUrl: "https://www.dharmashop.com/cdn/shop/files/singing-bowls-authentic-hand-hammered-tibetan-singing-bowl-set-1221378612_2000x.jpg?v=1771351912",
        category: "Meditation",
        amazonUrl: "https://www.amazon.ca/s?k=tibetan+singing+bowl+meditation+set",
      },
      {
        id: "amz-4",
        name: "Zafu Meditation Cushion",
        description: "Organic buckwheat hull filling, removable washable cover. Supports proper posture for deeper meditation sessions.",
        price: "CA$49.99",
        rating: 4.6,
        reviews: 5200,
        imageUrl: "https://beanproducts.com/cdn/shop/files/Hemp_Cactus_New_003f1d77-3ce4-4245-a817-1997935d1392_800x.png?v=1746663652",
        category: "Meditation",
        amazonUrl: "https://www.amazon.ca/s?k=zafu+meditation+cushion+buckwheat",
      },
      {
        id: "amz-5",
        name: "Mindfulness Cards Deck",
        description: "52 mindfulness & meditation exercise cards. One for each week. Beautifully illustrated with guided practices for stress relief.",
        price: "CA$19.95",
        rating: 4.7,
        reviews: 6800,
        imageUrl: "https://images.unsplash.com/photo-1602192509154-0b900ee1f851?w=400&h=400&fit=crop",
        category: "Wellness",
        amazonUrl: "https://www.amazon.ca/s?k=mindfulness+cards+deck+meditation",
      },
      {
        id: "amz-6",
        name: "Essential Oil Diffuser",
        description: "500ml ultrasonic aromatherapy diffuser with remote control. 7 LED colors, auto shut-off. Create a calming meditation space.",
        price: "CA$32.99",
        rating: 4.5,
        reviews: 46000,
        imageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop",
        category: "Wellness",
        amazonUrl: "https://www.amazon.ca/s?k=essential+oil+diffuser+aromatherapy+500ml",
      },
      {
        id: "amz-7",
        name: "Calm: The Journal",
        description: "From the makers of the Calm app. Beautiful guided journal for reflection, gratitude, and creativity. 224 pages of exercises.",
        price: "CA$22.99",
        rating: 4.6,
        reviews: 3200,
        imageUrl: "https://images.unsplash.com/photo-1474377207190-a7d8b3334068?w=400&h=400&fit=crop",
        category: "Journals",
        amazonUrl: "https://www.amazon.ca/s?k=calm+the+journal+guided+mindfulness",
      },
      {
        id: "amz-8",
        name: "Acupressure Mat & Pillow Set",
        description: "6,210 acupressure points for stress relief and relaxation. Includes mat and neck pillow. Used before or after meditation.",
        price: "CA$29.99",
        rating: 4.4,
        reviews: 46800,
        imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop",
        category: "Wellness",
        amazonUrl: "https://www.amazon.ca/s?k=acupressure+mat+pillow+set+relaxation",
      },
      {
        id: "amz-9",
        name: "Weighted Blanket 15 lbs",
        description: "Premium glass bead weighted blanket for anxiety relief and better sleep. Breathable cotton cover. Feels like a calming hug.",
        price: "CA$54.99",
        rating: 4.5,
        reviews: 32000,
        imageUrl: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400&h=400&fit=crop",
        category: "Wellness",
        amazonUrl: "https://www.amazon.ca/s?k=weighted+blanket+15+lbs+anxiety+relief",
      },
      {
        id: "amz-10",
        name: "Mala Beads Necklace",
        description: "108 natural stone meditation beads for mindful counting & breathing exercises. Handmade, perfect for meditation rituals.",
        price: "CA$17.99",
        rating: 4.6,
        reviews: 4100,
        imageUrl: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=400&fit=crop",
        category: "Meditation",
        amazonUrl: "https://www.amazon.ca/s?k=mala+beads+108+meditation+necklace",
      },
      {
        id: "amz-11",
        name: "Lavender Essential Oil",
        description: "Pure therapeutic-grade lavender oil for diffusers. Promotes relaxation, better sleep, and stress relief. 4 fl oz bottle.",
        price: "CA$12.99",
        rating: 4.7,
        reviews: 52000,
        imageUrl: "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=400&h=400&fit=crop",
        category: "Wellness",
        amazonUrl: "https://www.amazon.ca/s?k=lavender+essential+oil+therapeutic+grade",
      },
      {
        id: "amz-12",
        name: "The Miracle Morning Journal",
        description: "Companion journal to the bestselling book. 30-day guided morning routine with gratitude, affirmations, and visualization.",
        price: "CA$15.89",
        rating: 4.7,
        reviews: 7600,
        imageUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=400&fit=crop",
        category: "Journals",
        amazonUrl: "https://www.amazon.ca/s?k=miracle+morning+journal",
      },
    ];
    res.json(amazonProducts);
  });

  // ═══ PEACE OF MIND (Anonymous Problems & Solutions) ═════

  // Get all problems
  app.get("/api/problems", async (_req, res) => {
    try {
      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        // If table doesn't exist, return empty
        return res.json([]);
      }
      res.json(data || []);
    } catch {
      res.json([]);
    }
  });

  // Create anonymous problem
  app.post("/api/problems", async (req, res) => {
    try {
      const authUser = await getAuthUser(req);
      if (!authUser) return res.status(401).json({ error: "Not authenticated" });
      const { title, description, category } = req.body;
      if (!title || !description) {
        return res.status(400).json({ error: "Title and description are required" });
      }
      const userStorage = getUserStorage(req);
      const { data, error } = await (userStorage as any).supabase
        .from("problems")
        .insert({
          user_id: authUser.id,
          title,
          description,
          category: category || "General",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to create problem" });
    }
  });

  // Get comments for a problem
  app.get("/api/problems/:id/comments", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("problem_comments")
        .select("*")
        .eq("problem_id", req.params.id)
        .order("created_at", { ascending: true });
      if (error) return res.json([]);

      // Get profile display names for non-anonymous comments
      const profiles = await storage.getAllProfiles();
      const profileMap = new Map(profiles.map(p => [p.id, p]));

      const enriched = (data || []).map((c: any) => {
        // Check if this commenter is the original problem poster
        // We don't reveal identity - just mark as "Original Poster"
        return {
          ...c,
          author_name: c.is_anonymous ? "Anonymous" : (profileMap.get(c.user_id)?.display_name || "Member"),
        };
      });
      res.json(enriched);
    } catch {
      res.json([]);
    }
  });

  // Add comment to a problem
  app.post("/api/problems/:id/comments", async (req, res) => {
    try {
      const authUser = await getAuthUser(req);
      if (!authUser) return res.status(401).json({ error: "Not authenticated" });
      const { message, isAnonymous } = req.body;
      if (!message) return res.status(400).json({ error: "Message is required" });

      const userStorage = getUserStorage(req);
      const { data, error } = await (userStorage as any).supabase
        .from("problem_comments")
        .insert({
          problem_id: req.params.id,
          user_id: authUser.id,
          message,
          is_anonymous: isAnonymous ?? false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to add comment" });
    }
  });

  return httpServer;
}