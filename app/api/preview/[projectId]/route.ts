import { getSupabase } from "@/lib/supabase";

export async function GET(_req:Request,{params}:{params:Promise<{projectId:string}>}){
  const {projectId}=await params;
  const db=getSupabase();
  if(!db) return new Response('Supabase no configurado',{status:503});
  const {data,error}=await db.from('design_previews').select('html').eq('project_id',projectId).eq('creation_type','factory_html').order('updated_at',{ascending:false}).limit(1).maybeSingle();
  if(error||!data) return new Response('Preview no encontrada',{status:404});
  return new Response(data.html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-frame-options':'SAMEORIGIN','content-security-policy':"frame-ancestors 'self';"}});
}
