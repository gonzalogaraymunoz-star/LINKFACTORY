import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { BUILTIN_SKILLS, BUILTIN_STYLES, FACTORY_RULES, type FactoryCapability } from "@/lib/factory-capabilities";

export const maxDuration=120;

type Reference={id:string;label:string;url:string;role:string;notes?:string};
type Config={active_skills:string[];active_style:string|null;references:Reference[];custom_rules:string[];notify?:boolean;sound?:boolean};

const DEFAULT_CONFIG:Config={active_skills:["mobile-first","accessibility"],active_style:"link-minimal",references:[],custom_rules:[]};

function safeExternalUrl(value:string){
  const u=new URL(value); if(u.protocol!=="https:")throw new Error("Solo se permiten referencias HTTPS");
  const h=u.hostname.toLowerCase();
  if(h==="localhost"||h.endsWith(".local")||h==="127.0.0.1"||h==="::1"||/^10\./.test(h)||/^192\.168\./.test(h)||/^172\.(1[6-9]|2\d|3[0-1])\./.test(h))throw new Error("Referencia privada no permitida");
  return u;
}

function compactText(raw:string){return raw.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim()}

async function readReference(ref:Reference){
  try{
    const u=safeExternalUrl(ref.url);
    const r=await fetch(u,{headers:{accept:"text/html,text/plain,application/json;q=0.8,*/*;q=0.2","user-agent":"LINK-Factory/1.0"},redirect:"follow",cache:"no-store",signal:AbortSignal.timeout(7000)});
    const ct=r.headers.get("content-type")||"";
    if(!r.ok)return {...ref,extract:`No disponible (HTTP ${r.status})`};
    if(!/text|json|html|xml/.test(ct))return {...ref,extract:`Referencia binaria (${ct||"tipo desconocido"}); usar etiqueta/notas como orientación visual.`};
    const txt=(await r.text()).slice(0,50000); return {...ref,extract:compactText(txt).slice(0,12000)};
  }catch(err:any){return {...ref,extract:`No se pudo leer automáticamente: ${err?.message||"error"}`}}
}

async function customCapabilities(db:any):Promise<FactoryCapability[]>{
  try{
    const ns=await db.from("memory_namespaces").select("id").eq("scope_type","system").eq("scope_key","link_factory_capabilities").limit(1).maybeSingle();
    if(ns.error||!ns.data?.id)return [];
    const q=await db.from("deep_memories").select("structured_data").eq("namespace_id",ns.data.id).eq("kind","instruction").limit(200);
    if(q.error)return [];
    return (q.data||[]).map((x:any)=>x.structured_data).filter((x:any)=>x?.factory_capability===true&&x.id&&x.name&&Array.isArray(x.instructions));
  }catch{return []}
}

function chooseCapabilities(config:Config,custom:FactoryCapability[]){
  const all=[...BUILTIN_SKILLS,...BUILTIN_STYLES,...custom];
  const skills=(config.active_skills||[]).map(id=>all.find(x=>x.id===id&&x.kind==="skill")).filter(Boolean) as FactoryCapability[];
  const style=config.active_style?all.find(x=>x.id===config.active_style&&x.kind==="style")||null:null;
  return {skills,style};
}

async function loadContext(db:any,productId:string,instruction:string,withReferenceContent=true){
  const [{data:project,error:pError},{data:design,error:dError}]=await Promise.all([
    db.from("projects").select("*").eq("id",productId).single(),
    db.from("design_previews").select("*").eq("project_id",productId).eq("creation_type","factory_html").order("updated_at",{ascending:false}).limit(1).single()
  ]);
  if(pError)throw pError;if(dError)throw dError;
  const config:Config={...DEFAULT_CONFIG,...(project.metadata?.factory_config||{})};
  const [relations,memLinks,custom]=await Promise.all([
    db.from("entity_relations").select("target_type,target_key,relation,label,metadata").eq("source_type","project").eq("source_key",productId),
    db.from("memory_links").select("memory_id").eq("entity_type","project").eq("entity_key",productId),
    customCapabilities(db)
  ]);
  const memoryIds=(memLinks.data||[]).map((x:any)=>x.memory_id);
  const memories=memoryIds.length?await db.from("deep_memories").select("kind,content,importance,structured_data").in("id",memoryIds).order("importance",{ascending:false}).limit(16):{data:[]};
  const {skills,style}=chooseCapabilities(config,custom);
  const refs=withReferenceContent?await Promise.all((config.references||[]).slice(0,8).map(readReference)):(config.references||[]).map(r=>({...r,extract:"[contenido omitido en vista previa]"}));
  const context={
    product:{id:project.id,name:project.name,description:project.description,product_type:project.metadata?.product_type||"website",phase:project.phase||project.status,slug:project.slug},
    current_version:Number(design.current_version||0),businesses:relations.data||[],memories:memories.data||[],config,skills,style,references:refs,instruction
  };
  return {project,design,context,custom};
}

function compiledBrief(context:any){
  const skillText=context.skills.length?context.skills.map((s:FactoryCapability)=>`- ${s.name}:\n  ${s.instructions.join("\n  ")}`).join("\n"):"- Sin skills adicionales";
  const styleText=context.style?`- ${context.style.name}:\n  ${context.style.instructions.join("\n  ")}`:"- Sin style pack";
  const refText=context.references.length?context.references.map((r:any,i:number)=>`${i+1}. ${r.label} · rol=${r.role}\nURL: ${r.url}\nNotas: ${r.notes||"—"}\nContenido recuperado: ${r.extract||"—"}`).join("\n\n"):"- Sin referencias";
  const memoryText=context.memories.length?context.memories.map((m:any)=>`- [${m.kind}] ${String(m.content||"").slice(0,1800)}`).join("\n"):"- Sin memorias asociadas";
  const businessText=context.businesses.length?context.businesses.map((b:any)=>`- ${b.label||b.target_key} (${b.relation})`).join("\n"):"- Sin negocio asociado";
  const rules=[...FACTORY_RULES,...(context.config.custom_rules||[])];
  return `LINK FACTORY · PROMPT COMPILADO\n\nPRODUCTO\nNombre: ${context.product.name}\nTipo: ${context.product.product_type}\nDescripción: ${context.product.description||"—"}\nVersión actual: v${context.current_version}\n\nSOLICITUD ACTUAL\n${context.instruction}\n\nREGLAS INMUTABLES\n${rules.map((r:string,i:number)=>`${i+1}. ${r}`).join("\n")}\n\nHABILIDADES ACTIVAS\n${skillText}\n\nESTILO ACTIVO\n${styleText}\n\nREFERENCIAS\n${refText}\n\nNEGOCIOS\n${businessText}\n\nMEMORIA RELEVANTE\n${memoryText}`;
}

const SYSTEM=`Eres LINK Factory Build Engine. Editas una construcción web existente usando el prompt compilado que contiene reglas, skills, estilo, referencias y memoria real del negocio.\nDevuelve SIEMPRE JSON válido sin markdown con las claves summary, request_summary y html.\n- html debe ser un documento HTML completo listo para iframe.\n- summary explica el cambio realizado en una frase.\n- request_summary resume la solicitud del usuario sin inventar información.\n- Conserva contenido y funcionalidades no solicitadas.\n- No inventes datos.\n- No copies literalmente una referencia externa; úsala solo para patrones y dirección.\n- Mantén responsive, accesibilidad y funcionamiento real.`;

function extractJson(raw:string){
  const clean=raw.trim().replace(/^```json\s*/i,"").replace(/```$/i,"").trim();
  try{return JSON.parse(clean)}catch{}
  const a=clean.indexOf("{"),b=clean.lastIndexOf("}"); if(a>=0&&b>a)return JSON.parse(clean.slice(a,b+1));
  throw new Error("El LLM no devolvió JSON válido");
}

async function callLLM(compiled:string,currentHtml:string){
  const url=process.env.OPEN_SOURCE_LLM_API_URL; if(!url)throw new Error("OPEN_SOURCE_LLM_API_URL no configurado");
  const headers:Record<string,string>={"content-type":"application/json"}; if(process.env.OPEN_SOURCE_LLM_API_KEY)headers.authorization=`Bearer ${process.env.OPEN_SOURCE_LLM_API_KEY}`;
  const model=process.env.OPEN_SOURCE_LLM_MODEL||"factory-editor"; const temperature=.2;
  const base={model,temperature,messages:[{role:"system",content:SYSTEM},{role:"user",content:`${compiled}\n\nHTML ACTUAL\n${currentHtml}`}]};
  let r=await fetch(url,{method:"POST",headers,body:JSON.stringify({...base,response_format:{type:"json_object"}}),cache:"no-store",signal:AbortSignal.timeout(110000)});
  if(r.status===400||r.status===422)r=await fetch(url,{method:"POST",headers,body:JSON.stringify(base),cache:"no-store",signal:AbortSignal.timeout(110000)});
  if(!r.ok)throw new Error(`LLM ${r.status}: ${(await r.text()).slice(0,600)}`);
  const data=await r.json(); const content=data?.choices?.[0]?.message?.content??data?.message?.content??data?.output_text??data?.content;
  const result=typeof content==="object"?content:typeof content==="string"?extractJson(content):null; if(!result)throw new Error("Respuesta LLM incompatible");
  return {result,meta:{model,provider:new URL(url).hostname,temperature,generation_id:data?.id||r.headers.get("x-request-id")||null,created:data?.created||null,usage:data?.usage||null}};
}

export async function GET(req:Request){
  const db=getSupabase();if(!db)return NextResponse.json({error:"Supabase no configurado"},{status:503});
  try{const u=new URL(req.url),productId=String(u.searchParams.get("product_id")||""),instruction=String(u.searchParams.get("instruction")||"Sin nueva instrucción").slice(0,6000);if(!productId)throw new Error("product_id requerido");const {context}=await loadContext(db,productId,instruction,false);return NextResponse.json({compiled_prompt:compiledBrief(context),config:context.config,skills:context.skills,style:context.style,references:context.references})}catch(err:any){return NextResponse.json({error:err.message||"No se pudo compilar el prompt"},{status:400})}
}

export async function POST(req:Request){
  const db=getSupabase();if(!db)return NextResponse.json({error:"Supabase no configurado"},{status:503});
  let body:any;try{body=await req.json()}catch{return NextResponse.json({error:"JSON inválido"},{status:400})}
  const productId=String(body.product_id||""),instruction=String(body.instruction||"").trim();if(!productId||!instruction)return NextResponse.json({error:"Producto e instrucción requeridos"},{status:400});
  const encoder=new TextEncoder();
  const stream=new ReadableStream({async start(controller){
    const send=(payload:any)=>controller.enqueue(encoder.encode(JSON.stringify(payload)+"\n"));
    try{
      send({type:"progress",pct:5,stage:"Preparando construcción"});
      const {project,design,context}=await loadContext(db,productId,instruction,true);
      send({type:"progress",pct:18,stage:"Leyendo memoria"});
      send({type:"progress",pct:28,stage:`Cargando ${context.references.length} referencias`});
      const compiled=compiledBrief(context);
      send({type:"compiled",pct:34,stage:"Aplicando skills y estilo",compiled_prompt:compiled});
      send({type:"progress",pct:40,stage:"Generando HTML con IA",estimated:true});
      const {result,meta}=await callLLM(compiled,design.html);
      send({type:"progress",pct:82,stage:"Validando resultado"});
      if(!result?.html||typeof result.html!=="string"||!/<html[\s>]/i.test(result.html))throw new Error("La IA no devolvió un documento HTML completo");
      const nextVersion=Number(design.current_version||0)+1;const summary=String(result.summary||"Edición generada por LINK Factory").slice(0,500);const requestSummary=String(result.request_summary||summary).slice(0,700);const now=new Date().toISOString();
      send({type:"progress",pct:90,stage:"Guardando versión"});
      const metadata={source_app:"link-factory",instruction:instruction.slice(0,12000),request_summary:requestSummary,compiled_prompt:compiled.slice(0,50000),model:meta.model,provider:meta.provider,temperature:meta.temperature,generated_at:now,generation_id:meta.generation_id,created:meta.created,usage:meta.usage||null,skills:context.skills.map((x:FactoryCapability)=>x.id),style:context.style?.id||null,references:context.references.map((r:any)=>({id:r.id,label:r.label,url:r.url,role:r.role,notes:r.notes||""}))};
      const version=await db.from("design_versions").insert({design_id:design.id,version_number:nextVersion,html:result.html,change_summary:summary,source:"link-factory-build",metadata});if(version.error)throw version.error;
      send({type:"progress",pct:96,stage:"Actualizando preview"});
      const upd=await db.from("design_previews").update({html:result.html,current_version:nextVersion,status:"draft",updated_at:now,metadata:{...(design.metadata||{}),last_ai_edit_at:now,last_compiled_prompt:compiled.slice(0,50000),last_generation:{version:nextVersion,summary,request_summary:requestSummary,model:meta.model,provider:meta.provider,generated_at:now}}}).eq("id",design.id);if(upd.error)throw upd.error;
      await db.from("projects").update({description:project.description||requestSummary,phase:"building",updated_at:now,metadata:{...(project.metadata||{}),last_request_summary:requestSummary}}).eq("id",productId);
      const root=await db.from("controls").select("id").eq("is_root",true).limit(1).maybeSingle();if(root.data?.id)await db.from("event_bus").insert({control_id:root.data.id,source_provider:"link_factory",event_type:"factory.build.completed",entity_type:"project",global_id:productId,dedupe_key:`factory:build:${productId}:${nextVersion}:${Date.now()}`,payload:{version:nextVersion,summary,request_summary:requestSummary,skills:metadata.skills,style:metadata.style,references:metadata.references.length,model:meta.model}});
      send({type:"done",pct:100,stage:"Construcción lista",ok:true,version:nextVersion,summary,request_summary:requestSummary,usage:meta.usage||null,model:meta.model});
    }catch(err:any){send({type:"error",message:err?.name==="TimeoutError"?"La generación excedió el tiempo disponible. Intenta una instrucción más acotada o vuelve a ejecutar.":err.message||"Error de generación"});}
    finally{controller.close()}
  }});
  return new Response(stream,{headers:{"content-type":"application/x-ndjson; charset=utf-8","cache-control":"no-store, no-transform","x-accel-buffering":"no"}});
}
