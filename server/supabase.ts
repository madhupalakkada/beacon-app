import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = process.env.SUPABASE_URL || "https://your-project.supabase.co";
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "your-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
