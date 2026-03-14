import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  avatar: text("avatar"),
  bio: text("bio"),
  location: text("location"),
  googleId: text("google_id"),
  smileStreak: integer("smile_streak").default(0),
  totalSmiles: integer("total_smiles").default(0),
  tipsReceived: integer("tips_received").default(0),
});

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  imageUrl: text("image_url").notNull(),
  story: text("story").notNull(),
  gratitudeReason: text("gratitude_reason").notNull(),
  category: text("category").notNull(),
  likes: integer("likes").default(0),
  tips: integer("tips").default(0),
  isVerified: boolean("is_verified").default(false),
  createdAt: text("created_at").notNull(),
  region: text("region"),
});

export const likes = pgTable("likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull(),
  userId: varchar("user_id").notNull(),
});

export const tips = pgTable("tips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull(),
  fromUserId: varchar("from_user_id").notNull(),
  toUserId: varchar("to_user_id").notNull(),
  amount: integer("amount").notNull(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, smileStreak: true, totalSmiles: true, tipsReceived: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, likes: true, tips: true, isVerified: true });
export const insertLikeSchema = createInsertSchema(likes).omit({ id: true });
export const insertTipSchema = createInsertSchema(tips).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;
export type InsertTip = z.infer<typeof insertTipSchema>;
export type Tip = typeof tips.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;