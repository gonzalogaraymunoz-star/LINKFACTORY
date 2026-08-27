import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const STARTER_HTML = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Nuevo producto</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;background:#f3f0e9;color:#151515}.page{min-height:100vh;display:grid;place-items:center;padding:32px}.card{max-width:920px;width:100%;background:#fff;border:1px solid #dedbd3;border-radius:28px;padding:clamp(32px,8vw,96px);box-shadow:0 30px 90px rgba(0,0,0,.08)}.eyebrow{letter-spacing:.18em;text-transform:uppercase;font-size:12px}.hero{font-size:clamp(48px,9vw,110px);line-height:.9;letter-spacing:-.06em;margin:22px 0}.copy{font-size:18px;line-height:1.65;max-width:560px;color:#5f5b54}.cta{margin-top:34px;border:0;background:#111;color:#fff;border-radius:999px;padding:15px 24px;font-weight:700}
</style>
</head>
<body><main class="page"><section class="card"><div class="eyebrow">LINK FACTORY · WORKING HTML</div><h1 class="hero">Empieza<br/>a construir.</h1><p class="copy">Este es el HTML de trabajo. Conversa con AI Edit para modificarlo sin tocar producción.</p><button class="cta">Comenzar</button></section></main></body></html>`;

function slugify(v:string){return v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)}
function providerForCentral(provider:string){return ['supabase','github','vercel','drive','gmail','calendar','attio','other'].includes(provider)?provider:'other'}
function normalizedLinkStatus(status:string){if(status==='connected')return'verified';if(status==='error')return'broken';if(status==='warning')return'warning';return'unverified'}

function safeExternalUrl(value:string){
  const u=new URL(value);
  if(u.protocol!=='https:') throw new Error('Solo se permiten URLs HTTPS');
  const h=u.hostname.toLowerCase();
  if(h==='localhost'||h.endsWith('.local')||h==='127.0.0.1'||h==='::1'||/^10\./.test(h)||/^192\.168\./.test(h)||/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) throw new Error('No se permiten destinos locales o privados');
  return u;
}

async function rootControlId(db:any){
  const {data,error}=await db.from('controls').select('id').eq('is_root',true).limit(1).maybeSingle();
  if(error) throw error;
  return data?.id ?? null;
}

async function logEvent(db:any, controlId:string|null, eventType:string, entityId:string, payload:Record<string,unknown>={}){
  if(!controlId) return;
  await db.from('event_bus').insert({
    control_id:controlId,source_provider:'link_factory',event_type:eventType,entity_type:'project',global_id:entityId,
    dedupe_key:`factory:${eventType}:${entityId}:${Date.now()}:${Math.random().toString(36).slice(2,8)}`,payload
  });
}

async function ensureDesign(db:any, project:any){
  const {data:existing,error}=await db.from('design_previews').select('*').eq('project_id',project.id).eq('creation_type','factory_html').order('updated_at',{ascending:false}).limit(1).maybeSingle();
  if(error) throw error;
  if(existing) return existing;
  const slug=`${project.slug}-factory`;
  const created=await db.from('design_previews').insert({
    project_id:project.id,title:project.name,slug,html:STARTER_HTML,creation_type:'factory_html',status:'draft',current_version:1,
    metadata:{source_app:'link-factory',working_copy:true}
  }).select().single();
  if(created.error) throw created.error;
  const version=await db.from('design_versions').insert({design_id:created.data.id,version_number:1,html:STARTER_HTML,change_summary:'Versión inicial',source:'link-factory',metadata:{source_app:'link-factory'}});
  if(version.error) throw version.error;
  return created.data;
}

export async function GET(){
  const db=getSupabase();
  if(!db) return NextResponse.json({error:'Supabase de Control Central no configurado'}, {status:503});
  const {data:projects,error}=await db.from('projects').select('*').eq('kind','factory_product').order('updated_at',{ascending:false});
  if(error) return NextResponse.json({error:error.message},{status:500});
  const ids=(projects||[]).map((p:any)=>p.id);
  if(!ids.length) return NextResponse.json({products:[]});

  const [integrations,relations,assets,memoryLinks,designs]=await Promise.all([
    db.from('project_integrations').select('*').in('project_id',ids),
    db.from('entity_relations').select('*').eq('source_type','project').in('source_key',ids),
    db.from('assets').select('id,project_id').in('project_id',ids),
    db.from('memory_links').select('memory_id,entity_key').eq('entity_type','project').in('entity_key',ids),
    db.from('design_previews').select('id,project_id,status,current_version,updated_at,metadata').in('project_id',ids).eq('creation_type','factory_html')
  ]);

  const designIds=(designs.data||[]).map((d:any)=>d.id);
  const versions=designIds.length?await db.from('design_versions').select('id,design_id,version_number,change_summary,created_at,metadata').in('design_id',designIds).order('version_number',{ascending:false}):{data:[]};
  const out=(projects||[]).map((p:any)=>{
    const design=(designs.data||[]).filter((d:any)=>d.project_id===p.id).sort((a:any,b:any)=>String(b.updated_at).localeCompare(String(a.updated_at)))[0]||null;
    return {
      id:p.id,name:p.name,slug:p.slug,product_type:p.metadata?.product_type||'graphic',description:p.description,status:p.phase||p.status,
      design_id:design?.id||null,current_version:design?.current_version||0,design_status:design?.status||'missing',
      internal_preview_url:design?`/api/preview/${p.id}`:null,
      links:(integrations.data||[]).filter((x:any)=>x.project_id===p.id).map((x:any)=>({id:x.id,provider:x.metadata?.provider_alias||x.provider,link_type:x.metadata?.link_type||x.environment||'link',label:x.label,url:x.url,status:normalizedLinkStatus(x.status),verified_at:x.metadata?.verified_at||x.last_checked_at||null})),
      businesses:(relations.data||[]).filter((x:any)=>x.source_key===p.id && ['business_ref','client'].includes(x.target_type)).map((x:any)=>({business_key:x.target_key,business_name:x.label||x.metadata?.business_name||x.target_key,relation_role:x.relation,control_id:x.control_id||null})),
      memory_count:(memoryLinks.data||[]).filter((x:any)=>x.entity_key===p.id).length,
      asset_count:(assets.data||[]).filter((x:any)=>x.project_id===p.id).length,
      history:design?(versions.data||[]).filter((v:any)=>v.design_id===design.id).slice(0,20):[]
    };
  });
  return NextResponse.json({products:out,ai:{configured:Boolean(process.env.OPEN_SOURCE_LLM_API_URL)}});
}

export async function POST(req:Request){
  const db=getSupabase();
  if(!db) return NextResponse.json({error:'Supabase de Control Central no configurado'}, {status:503});
  const body=await req.json();
  const action=body.action;
  try{
    const controlId=await rootControlId(db);
    if(action==='create_product'){
      const name=String(body.name||'').trim(); if(!name) throw new Error('Nombre requerido');
      let slug=slugify(name); if(!slug) slug=`factory-${Date.now()}`;
      const {data:exists}=await db.from('projects').select('id').eq('slug',slug).maybeSingle(); if(exists) slug=`${slug}-${Date.now().toString(36)}`;
      const {data,error}=await db.from('projects').insert({name,slug,description:body.description||null,status:'active',kind:'factory_product',phase:'discovery',metadata:{source_app:'link-factory',product_type:body.product_type||'website',storage_policy:'control-central'}}).select().single();
      if(error) throw error;
      const design=await ensureDesign(db,data);
      await logEvent(db,controlId,'factory.product.created',data.id,{name,design_id:design.id});
      return NextResponse.json({product:data,design});
    }
    if(action==='ensure_design'){
      const {data:project,error}=await db.from('projects').select('*').eq('id',body.product_id).single(); if(error) throw error;
      const design=await ensureDesign(db,project); return NextResponse.json({design});
    }
    if(action==='add_link'){
      const url=String(body.url||'').trim(); safeExternalUrl(url);
      const alias=String(body.provider||'other').toLowerCase(); const provider=providerForCentral(alias);
      const {data,error}=await db.from('project_integrations').insert({project_id:body.product_id,provider,label:body.label,external_id:null,url,environment:String(body.link_type||'link'),status:'disconnected',metadata:{source_app:'link-factory',provider_alias:alias,link_type:body.link_type||'link',verification_state:'unverified'}}).select().single();
      if(error) throw error; await logEvent(db,controlId,'factory.integration.added',String(body.product_id),{provider:alias,url}); return NextResponse.json({link:data});
    }
    if(action==='verify_link'){
      const {data:link,error:e1}=await db.from('project_integrations').select('*').eq('id',body.link_id).single(); if(e1) throw e1;
      if(!link?.url) throw new Error('El link no tiene URL'); safeExternalUrl(link.url); let status='error'; let code:number|null=null;
      try{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);const r=await fetch(link.url,{method:'GET',redirect:'follow',cache:'no-store',signal:controller.signal});clearTimeout(timer);code=r.status;if(r.ok)status='connected';else if(r.status===401||r.status===403)status='warning';}catch{}
      const now=new Date().toISOString(); const {error}=await db.from('project_integrations').update({status,last_checked_at:now,metadata:{...(link.metadata||{}),verification_state:status==='connected'?'verified':status==='warning'?'protected':'broken',verified_at:status==='connected'?now:null,last_http_status:code}}).eq('id',body.link_id); if(error) throw error;
      await logEvent(db,controlId,'factory.integration.verified',link.project_id,{integration_id:link.id,status,code}); return NextResponse.json({status:normalizedLinkStatus(status),code});
    }
    if(action==='add_business'){
      const businessName=String(body.business_name||'').trim(); if(!businessName) throw new Error('Negocio requerido'); const businessKey=slugify(businessName); const role=String(body.relation_role||body.role||'belongs_to');
      const {data:client}=await db.from('clients').select('id,name,control_id').or(`slug.eq.${businessKey},name.ilike.${businessName.replace(/,/g,'')}`).limit(1).maybeSingle();
      const targetType=client?'client':'business_ref'; const targetKey=client?.id||businessKey;
      const {error}=await db.from('entity_relations').upsert({control_id:client?.control_id||controlId,source_type:'project',source_key:body.product_id,target_type:targetType,target_key:targetKey,relation:role,label:client?.name||businessName,metadata:{source_app:'link-factory',business_name:client?.name||businessName,resolution:client?'resolved':'reference_only'}},{onConflict:'source_type,source_key,target_type,target_key,relation'}); if(error) throw error;
      await logEvent(db,controlId,'factory.business.linked',String(body.product_id),{business_name:businessName,resolution:client?'resolved':'reference_only'}); return NextResponse.json({ok:true});
    }
    if(action==='add_memory'){
      const productId=String(body.product_id||''); const title=String(body.title||'').trim(); if(!title) throw new Error('Título requerido');
      let {data:namespace,error:nsError}=await db.from('memory_namespaces').select('*').eq('scope_type','factory_product').eq('scope_key',productId).limit(1).maybeSingle(); if(nsError) throw nsError;
      if(!namespace){const created=await db.from('memory_namespaces').insert({control_id:controlId,scope_type:'factory_product',scope_key:productId,label:`Factory ${productId}`,metadata:{source_app:'link-factory'}}).select().single(); if(created.error) throw created.error; namespace=created.data;}
      const {data:memory,error:mError}=await db.from('deep_memories').insert({namespace_id:namespace.id,memory_key:`${slugify(title)}-${Date.now().toString(36)}`,kind:body.memory_type||'context',content:String(body.summary||title),importance:3,source:'link-factory',source_ref:body.source_url||null,structured_data:{title,source_url:body.source_url||null},metadata:{source_app:'link-factory'}}).select().single(); if(mError) throw mError;
      const {error:lError}=await db.from('memory_links').insert({memory_id:memory.id,entity_type:'project',entity_key:productId,relation:'about',metadata:{source_app:'link-factory'}}); if(lError) throw lError;
      await logEvent(db,controlId,'factory.memory.created',productId,{memory_id:memory.id,title}); return NextResponse.json({ok:true,memory_id:memory.id});
    }
    if(action==='approve_version'){
      const productId=String(body.product_id); const {data:design,error}=await db.from('design_previews').select('*').eq('project_id',productId).eq('creation_type','factory_html').order('updated_at',{ascending:false}).limit(1).single(); if(error) throw error;
      const now=new Date().toISOString(); await db.from('design_previews').update({status:'approved',metadata:{...(design.metadata||{}),approved_version:design.current_version,approved_at:now}}).eq('id',design.id);
      await db.from('projects').update({phase:'approved',updated_at:now}).eq('id',productId);
      await logEvent(db,controlId,'factory.version.approved',productId,{design_id:design.id,version:design.current_version}); return NextResponse.json({ok:true,version:design.current_version});
    }
    if(action==='restore_version'){
      const productId=String(body.product_id); const versionNumber=Number(body.version_number); const {data:design,error}=await db.from('design_previews').select('*').eq('project_id',productId).eq('creation_type','factory_html').order('updated_at',{ascending:false}).limit(1).single(); if(error) throw error;
      const {data:version,error:vError}=await db.from('design_versions').select('*').eq('design_id',design.id).eq('version_number',versionNumber).single(); if(vError) throw vError;
      const newVersion=Number(design.current_version||0)+1; await db.from('design_versions').insert({design_id:design.id,version_number:newVersion,html:version.html,change_summary:`Restaurado desde v${versionNumber}`,source:'link-factory',metadata:{restored_from:versionNumber,source_app:'link-factory'}});
      await db.from('design_previews').update({html:version.html,current_version:newVersion,status:'draft',updated_at:new Date().toISOString()}).eq('id',design.id);
      await logEvent(db,controlId,'factory.version.restored',productId,{from:versionNumber,to:newVersion}); return NextResponse.json({ok:true,version:newVersion});
    }
    return NextResponse.json({error:'Acción no soportada'},{status:400});
  }catch(err:any){return NextResponse.json({error:err.message||'Error'},{status:400})}
}
