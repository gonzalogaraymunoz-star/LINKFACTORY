import { getSupabase } from "@/lib/supabase";

export async function GET(_req:Request,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const db=getSupabase();
  if(!db) return new Response('Supabase no configurado',{status:503});

  const {data:project,error:pError}=await db.from('projects').select('id,name,slug').eq('slug',slug).maybeSingle();
  if(pError||!project) return new Response('Producto no encontrado',{status:404});

  const {data:design,error:dError}=await db.from('design_previews').select('id,status,current_version,metadata').eq('project_id',project.id).eq('creation_type','factory_html').order('updated_at',{ascending:false}).limit(1).maybeSingle();
  if(dError||!design) return new Response('Diseño no encontrado',{status:404});

  const approvedVersion=Number(design.metadata?.approved_version||0);
  if(!approvedVersion) return new Response('Este producto todavía no tiene una versión aprobada',{status:404});

  const {data:version,error:vError}=await db.from('design_versions').select('html').eq('design_id',design.id).eq('version_number',approvedVersion).maybeSingle();
  if(vError||!version?.html) return new Response('Versión aprobada no encontrada',{status:404});

  return new Response(version.html,{
    headers:{
      'content-type':'text/html; charset=utf-8',
      'cache-control':'no-store',
      'x-link-factory-product':project.slug,
      'x-link-factory-approved-version':String(approvedVersion)
    }
  });
}
