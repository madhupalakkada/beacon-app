// Shared TypeScript types for Beacon app
// These mirror the Supabase database schema

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  smileStreak: number;
  totalSmiles: number;
  tipsReceived: number;
}

export interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  story: string;
  gratitudeReason: string;
  category: string;
  likes: number;
  tips: number;
  isVerified: boolean;
  createdAt: string;
  region: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
}

export interface Like {
  id: string;
  postId: string;
  userId: string;
}

export interface Tip {
  id: string;
  postId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export type GratitudeCategory =
  | "Family"
  | "Nature"
  | "Friendship"
  | "Career"
  | "Wellness"
  | "Kindness"
  | "Community";

export const GRATITUDE_CATEGORIES: GratitudeCategory[] = [
  "Family",
  "Nature",
  "Friendship",
  "Career",
  "Wellness",
  "Kindness",
  "Community",
];
