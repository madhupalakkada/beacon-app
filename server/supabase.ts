import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://oqovjcgyvwqmmfsvuykv.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xb3ZqY2d5dndxbW1mc3Z1eWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTE4MjAsImV4cCI6MjA4OTA2NzgyMH0.f7QbaohMCuybUYh1eBFPtVzpL3goJpD472qEDWtxlEw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export { supabaseUrl, supabaseAnonKey };