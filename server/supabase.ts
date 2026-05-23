import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const supabaseUrl = process.env.SUPABASE_URL || "https://oqovjcgyvwqmmfsvuykv.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xb3ZqY2d5dndxbW1mc3Z1eWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTE4MjAsImV4cCI6MjA4OTA2NzgyMH0.f7QbaohMCuybUYh1eBFPtVzpL3goJpD472qEDWtxlEw";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Node 20 lacks native WebSocket; Supabase Realtime needs an explicit transport.
const realtimeOpts = { realtime: { transport: ws as any } };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, realtimeOpts);

// Admin client with service role key (for password resets, user management)
// Only available if SUPABASE_SERVICE_ROLE_KEY is set
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false }, ...realtimeOpts })
  : null;

export { supabaseUrl, supabaseAnonKey };