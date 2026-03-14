import { supabase } from "./supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

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

export class SupabaseStorage {
  private db: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.db = client || supabase;
  }

  // Profiles
  async getProfile(id: string): Promise<Profile | null> {
    const { data, error } = await this.db
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data;
  }

  async getProfileByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await this.db
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();
    if (error) return null;
    return data;
  }

  async getProfileByEmail(email: string): Promise<Profile | null> {
    const { data, error } = await this.db
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();
    if (error) return null;
    return data;
  }

  async createProfile(profile: Omit<Profile, "smile_streak" | "total_smiles" | "tips_received">): Promise<Profile> {
    const { data, error } = await this.db
      .from("profiles")
      .insert(profile)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await this.db
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getLeaderboard(): Promise<Profile[]> {
    const { data, error } = await this.db
      .from("profiles")
      .select("*")
      .order("total_smiles", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data || [];
  }

  // Posts
  async getPosts(filters?: { category?: string; userId?: string }): Promise<Post[]> {
    let query = this.db.from("posts").select("*").order("created_at", { ascending: false });
    if (filters?.category) query = query.eq("category", filters.category);
    if (filters?.userId) query = query.eq("user_id", filters.userId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async createPost(post: Omit<Post, "id" | "likes" | "tips" | "is_verified" | "created_at">): Promise<Post> {
    const { data, error } = await this.db
      .from("posts")
      .insert(post)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // Likes
  async likePost(postId: string, userId: string): Promise<void> {
    const { error: likeError } = await this.db
      .from("likes")
      .insert({ post_id: postId, user_id: userId });
    if (likeError && !likeError.message.includes("duplicate")) {
      throw new Error(likeError.message);
    }

    const { data: post } = await this.db
      .from("posts")
      .select("likes")
      .eq("id", postId)
      .single();

    if (post) {
      await this.db
        .from("posts")
        .update({ likes: (post.likes || 0) + 1 })
        .eq("id", postId);
    }
  }

  async hasLiked(postId: string, userId: string): Promise<boolean> {
    const { data } = await this.db
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();
    return !!data;
  }

  // Tips
  async tipPost(postId: string, fromUserId: string, toUserId: string, amount: number): Promise<void> {
    const { error: tipError } = await this.db
      .from("tips")
      .insert({ post_id: postId, from_user_id: fromUserId, to_user_id: toUserId, amount });
    if (tipError) throw new Error(tipError.message);

    const { data: post } = await this.db
      .from("posts")
      .select("tips")
      .eq("id", postId)
      .single();

    if (post) {
      await this.db
        .from("posts")
        .update({ tips: (post.tips || 0) + amount })
        .eq("id", postId);
    }

    const { data: profile } = await this.db
      .from("profiles")
      .select("tips_received")
      .eq("id", toUserId)
      .single();

    if (profile) {
      await this.db
        .from("profiles")
        .update({ tips_received: (profile.tips_received || 0) + amount })
        .eq("id", toUserId);
    }
  }

  // Products
  async getProducts(): Promise<Product[]> {
    const { data, error } = await this.db
      .from("products")
      .select("*");
    if (error) throw new Error(error.message);
    return data || [];
  }

  async createProduct(product: Omit<Product, "id">): Promise<Product> {
    const { data, error } = await this.db
      .from("products")
      .insert(product)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
}

export const storage = new SupabaseStorage();
