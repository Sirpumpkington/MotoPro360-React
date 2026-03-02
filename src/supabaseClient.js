import { createClient } from "@supabase/supabase-js";

// Sanitize env values in case they include accidental quotes or spaces
const rawUrl = import.meta.env.VITE_SUPABASE_URL || "";
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseUrl = String(rawUrl)
  .replace(/^\s+|\s+$/g, "")
  .replace(/^['\"]|['\"]$/g, "");
const supabaseAnonKey = String(rawKey)
  .replace(/^\s+|\s+$/g, "")
  .replace(/^['\"]|['\"]$/g, "");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
