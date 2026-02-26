import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rvahoodzhmktpxqrhofw.supabase.co";
const supabaseAnonKey = "SENING_ANON_KEYING";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
