-- ============================================
-- BEACON APP - Supabase Database Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT,
  avatar TEXT,
  bio TEXT,
  location TEXT,
  smile_streak INTEGER DEFAULT 0,
  total_smiles INTEGER DEFAULT 0,
  tips_received INTEGER DEFAULT 0
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  story TEXT NOT NULL,
  gratitude_reason TEXT NOT NULL,
  category TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  tips INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  region TEXT
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(post_id, user_id)
);

-- Tips table
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policies: profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies: posts
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Posts can be updated by anyone" ON posts FOR UPDATE USING (true);

-- RLS Policies: likes
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies: tips
CREATE POLICY "Tips are viewable by everyone" ON tips FOR SELECT USING (true);
CREATE POLICY "Authenticated users can tip" ON tips FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- RLS Policies: products
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Anyone can insert products" ON products FOR INSERT WITH CHECK (true);

-- Seed products
INSERT INTO products (name, description, price, image_url, category) VALUES
('Gratitude Journal', '365-day guided gratitude journal with daily prompts to cultivate thankfulness', 2499, 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&h=400&fit=crop', 'Books'),
('Mindfulness Bell', 'Tibetan singing bowl for meditation and mindfulness practice', 3499, 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400&h=400&fit=crop', 'Wellness'),
('Happiness Planner', 'Science-based planner designed to boost happiness and productivity', 1999, 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=400&h=400&fit=crop', 'Books'),
('Relaxation Tea Set', 'Organic chamomile and lavender tea set for evening wind-down rituals', 1599, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop', 'Wellness'),
('Affirmation Cards', '52 beautifully designed affirmation cards, one for each week', 1299, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop', 'Books'),
('Meditation Cushion', 'Premium buckwheat hull meditation cushion for comfortable practice', 4999, 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&h=400&fit=crop', 'Wellness');
