import { supabase as defaultSupabase } from "./supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Types (matching Supabase snake_case tables) ─────────
export interface Profile {
  id: string;
  username: string;
  display_name: string;
  email: string | null;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  smile_streak: number;
  total_smiles: number;
  tips_received: number;
}

export interface Post {
  id: string;
  user_id: string;
  image_url: string;
  story: string;
  gratitude_reason: string;
  category: string;
  likes: number;
  tips: number;
  is_verified: boolean;
  created_at: string;
  region: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
}

// ─── Storage Interface ───────────────────────────────────
export interface IStorage {
  getProfile(id: string): Promise<Profile | null>;
  getProfileByUsername(username: string): Promise<Profile | null>;
  getProfileByEmail(email: string): Promise<Profile | null>;
  createProfile(profile: Omit<Profile, "smile_streak" | "total_smiles" | "tips_received">): Promise<Profile>;
  updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | null>;
  getAllProfiles(): Promise<Profile[]>;
  getTopProfiles(limit: number): Promise<Profile[]>;

  getPosts(): Promise<Post[]>;
  getPost(id: string): Promise<Post | null>;
  getPostsByUser(userId: string): Promise<Post[]>;
  createPost(post: Omit<Post, "id" | "likes" | "tips" | "is_verified">): Promise<Post>;
  likePost(postId: string, userId: string): Promise<Post | null>;
  tipPost(postId: string, fromUserId: string, toUserId: string, amount: number): Promise<Post | null>;
  getWeeklyTop(limit: number): Promise<Post[]>;

  getProducts(): Promise<Product[]>;
}

// ─── Supabase Implementation ─────────────────────────────
export class SupabaseStorage implements IStorage {
  private supabase: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.supabase = client || defaultSupabase;
  }

  async getProfile(id: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data;
  }

  async getProfileByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();
    if (error || !data) return null;
    return data;
  }

  async getProfileByEmail(email: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();
    if (error || !data) return null;
    return data;
  }

  async createProfile(profile: Omit<Profile, "smile_streak" | "total_smiles" | "tips_received">): Promise<Profile> {
    const { data, error } = await this.supabase
      .from("profiles")
      .insert({
        ...profile,
        smile_streak: 0,
        total_smiles: 0,
        tips_received: 0,
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to create profile: ${error.message}`);
    return data;
  }

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) return null;
    return data;
  }

  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await this.supabase.from("profiles").select("*");
    if (error) return [];
    return data || [];
  }

  async getTopProfiles(limit: number): Promise<Profile[]> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .order("total_smiles", { ascending: false })
      .limit(limit);
    if (error) return [];
    return data || [];
  }

  async getPosts(): Promise<Post[]> {
    const { data, error } = await this.supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return [];
    return data || [];
  }

  async getPost(id: string): Promise<Post | null> {
    const { data, error } = await this.supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data;
  }

  async getPostsByUser(userId: string): Promise<Post[]> {
    const { data, error } = await this.supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return data || [];
  }

  async createPost(post: Omit<Post, "id" | "likes" | "tips" | "is_verified">): Promise<Post> {
    const { data, error } = await this.supabase
      .from("posts")
      .insert({
        ...post,
        likes: 0,
        tips: 0,
        is_verified: false,
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to create post: ${error.message}`);

    // Update user's smile stats
    const profile = await this.getProfile(post.user_id);
    if (profile) {
      await this.updateProfile(post.user_id, {
        total_smiles: (profile.total_smiles || 0) + 1,
        smile_streak: (profile.smile_streak || 0) + 1,
      });
    }
    return data;
  }

  async likePost(postId: string, userId: string): Promise<Post | null> {
    // Check if already liked
    const { data: existing } = await this.supabase
      .from("likes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();

    if (existing) return this.getPost(postId);

    // Insert like
    await this.supabase.from("likes").insert({ post_id: postId, user_id: userId });

    // Increment post likes
    const post = await this.getPost(postId);
    if (post) {
      await this.supabase
        .from("posts")
        .update({ likes: (post.likes || 0) + 1 })
        .eq("id", postId);
      return { ...post, likes: (post.likes || 0) + 1 };
    }
    return null;
  }

  async tipPost(postId: string, fromUserId: string, toUserId: string, amount: number): Promise<Post | null> {
    await this.supabase
      .from("tips")
      .insert({ post_id: postId, from_user_id: fromUserId, to_user_id: toUserId, amount });

    const post = await this.getPost(postId);
    if (post) {
      await this.supabase
        .from("posts")
        .update({ tips: (post.tips || 0) + amount })
        .eq("id", postId);

      const toProfile = await this.getProfile(toUserId);
      if (toProfile) {
        await this.updateProfile(toUserId, {
          tips_received: (toProfile.tips_received || 0) + amount,
        });
      }
      return { ...post, tips: (post.tips || 0) + amount };
    }
    return null;
  }

  async getWeeklyTop(limit: number): Promise<Post[]> {
    const { data, error } = await this.supabase
      .from("posts")
      .select("*")
      .order("likes", { ascending: false })
      .limit(limit);
    if (error) return [];
    return data || [];
  }

  async getProducts(): Promise<Product[]> {
    const { data, error } = await this.supabase.from("products").select("*");
    if (error) return [];
    return data || [];
  }
}

export const storage = new SupabaseStorage();