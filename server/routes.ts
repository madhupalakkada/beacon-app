import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage, SupabaseStorage, type Post, type Profile } from "./storage";
import { supabase, supabaseUrl, supabaseAnonKey } from "./supabase";
import { createClient } from "@supabase/supabase-js";

// ─── Helpers ─────────────────────────────────────────────

// Create a user-scoped Supabase client for write operations that respect RLS
function getUserClient(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
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

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (error || !data.user || !data.session) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const profile = await storage.getProfile(data.user.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      res.json({
        user: normalizeProfile(profile),
        token: data.session.access_token,
      });
    } catch (err: any) {
      console.error("Login error:", err);
      res.status(500).json({ error: err.message || "Login failed" });
    }
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    try {
      const authUser = await getAuthUser(req);
      if (!authUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const profile = await storage.getProfile(authUser.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      res.json({ user: normalizeProfile(profile) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ═══ USERS ════════════════════════════════════════════

  app.get("/api/users/:username", async (req, res) => {
    try {
      const profile = await storage.getProfileByUsername(req.params.username);
      if (!profile) return res.status(404).json({ error: "User not found" });
      res.json({ user: normalizeProfile(profile) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/users/me", async (req, res) => {
    try {
      const authUser = await getAuthUser(req);
      if (!authUser) return res.status(401).json({ error: "Unauthorized" });

      const allowed = ["display_name", "bio", "location", "avatar"];
      const updates: any = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }

      const updated = await storage.updateProfile(authUser.id, updates);
      res.json({ user: normalizeProfile(updated) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ═══ POSTS ════════════════════════════════════════════

  app.get("/api/posts", async (req, res) => {
    try {
      const { category, userId } = req.query as { category?: string; userId?: string };
      const posts = await storage.getPosts({ category, userId });
      res.json({ posts: posts.map(normalizePost) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const authUser = await getAuthUser(req);
      if (!authUser) return res.status(401).json({ error: "Unauthorized" });

      const { imageUrl, story, gratitudeReason, category, region } = req.body;
      if (!imageUrl || !story || !gratitudeReason || !category) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const userStorage = getUserStorage(req);
      const post = await userStorage.createPost({
        user_id: authUser.id,
        image_url: imageUrl,
        story,
        gratitude_reason: gratitudeReason,
        category,
        region: region || null,
      });

      // Increment smile streak + total smiles
      const profile = await storage.getProfile(authUser.id);
      if (profile) {
        await storage.updateProfile(authUser.id, {
          smile_streak: (profile.smile_streak || 0) + 1,
          total_smiles: (profile.total_smiles || 0) + 1,
        });
      }

      res.json({ post: normalizePost(post) });
    } catch (err: any) {
      console.error("Create post error:", err);
      res.status(500).json({ error: err.message || "Failed to create post" });
    }
  });

  // ═══ LIKES ════════════════════════════════════════════

  app.post("/api/posts/:postId/like", async (req, res) => {
    try {
      const authUser = await getAuthUser(req);
      if (!authUser) return res.status(401).json({ error: "Unauthorized" });

      const userStorage = getUserStorage(req);
      await userStorage.likePost(req.params.postId, authUser.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/posts/:postId/liked", async (req, res) => {
    try {
      const authUser = await getAuthUser(req);
      if (!authUser) return res.status(401).json({ liked: false });

      const liked = await storage.hasLiked(req.params.postId, authUser.id);
      res.json({ liked });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ═══ TIPS ═════════════════════════════════════════════

  app.post("/api/posts/:postId/tip", async (req, res) => {
    try {
      const authUser = await getAuthUser(req);
      if (!authUser) return res.status(401).json({ error: "Unauthorized" });

      const { toUserId, amount } = req.body;
      if (!toUserId || !amount) {
        return res.status(400).json({ error: "toUserId and amount are required" });
      }

      const userStorage = getUserStorage(req);
      await userStorage.tipPost(req.params.postId, authUser.id, toUserId, amount);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ═══ LEADERBOARD ═════════════════════════════════════

  app.get("/api/leaderboard", async (req, res) => {
    try {
      const profiles = await storage.getLeaderboard();
      res.json({ profiles: profiles.map(normalizeProfile) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ═══ PRODUCTS ═════════════════════════════════════════

  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json({ products });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const { name, description, price, imageUrl, category } = req.body;
      const product = await storage.createProduct({
        name,
        description,
        price,
        image_url: imageUrl,
        category,
      });
      res.json({ product });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return httpServer;
}
