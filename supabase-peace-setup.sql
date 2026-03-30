-- Peace of Mind feature: Anonymous problems and comments
-- Run this in your Supabase SQL Editor

-- Problems table (anonymous posts)
CREATE TABLE IF NOT EXISTS problems (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'General',
  created_at timestamptz DEFAULT now()
);

-- Problem comments table
CREATE TABLE IF NOT EXISTS problem_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  message text NOT NULL,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_comments ENABLE ROW LEVEL SECURITY;

-- Problems: anyone authenticated can read all problems
CREATE POLICY "Anyone can view problems" ON problems
  FOR SELECT USING (true);

-- Problems: authenticated users can create
CREATE POLICY "Authenticated users can create problems" ON problems
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Comments: anyone authenticated can read all comments
CREATE POLICY "Anyone can view comments" ON problem_comments
  FOR SELECT USING (true);

-- Comments: authenticated users can create comments
CREATE POLICY "Authenticated users can create comments" ON problem_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);