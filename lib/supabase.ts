import { createClient } from "@supabase/supabase-js";

const CENTRAL_URL = "https://zgbnjlrxzvzpigmwidsp.supabase.co";

export function getSupabase(){
  const url = process.env.CONTROL_CENTRAL_SUPABASE_URL || CENTRAL_URL;
  const key = process.env.CONTROL_CENTRAL_SUPABASE_SERVICE_ROLE_KEY;
  if(!key) return null;
  return createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
}
