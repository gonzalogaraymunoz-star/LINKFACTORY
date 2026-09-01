import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { VideoAudience, VideoAspectRatio, VideoLanguage, VideoObjective, VideoStoryboard } from "@/lib/video/types";

export const maxDuration=120;

const SYSTEM=`Eres el Constructor de Videos de LINK Factory. Tu trabajo es transformar una solución digital real en un storyboard B2B claro. No inventes métricas, clientes, resultados, integraciones ni capacidades. Usa solamente el contexto entregado. Devuelve JSON válido sin markdown con: title, hook, scenes y cta. Cada scene debe incluir order, purpose, headline, screen_text, narration, visual_direction y duration. Una idea central por escena. Prioriza problema → fricción → solución → funcionamiento → valor → CTA. Si falta información, dilo de forma neutral en vez de inventarla.`;

function extractJson(raw:string){
  const clean=raw.trim().replace(/^```json\s*/i,"").replace(/```$/i,"").trim();
  try{return JSON.parse(clean)}catch{}
  const a=clean.indexOf("{"),b=clean.lastIndexOf("}");
  if(a>=0&&b>a)return JSON.parse(clean.slice(a,b+1));
  throw new Error("El modelo no devolvió JSON válido");
}

async function callLLM(prompt:string){
  const url=process.env.OPEN_SOURCE_LLM_API_URL;
  if(!url)throw new Error("Motor IA no configurado: falta OPEN_SOURCE_LLM_API_URL");
  const headers:Record<string,string>={"content-type":"application/json"};
  if(process.env.OPEN_SOURCE_LLM_API_KEY)headers.authorization=`Bearer ${process.env.OPEN_SOURCE_LLM_API_KEY}`;
  const model=process.env.OPEN_SOURCE_LLM_MODEL||"factory-editor";
  const body={model,temperature:.2,messages:[{role:"system",content:SYSTEM},{role:"user",content:prompt}],response_format:{type:"json_object"}};
  let r=await fetch(url,{method:"POST",headers,body:JSON.stringify(body),cache:"no-store",signal:AbortSignal.timeout(110000)});
  if(r.status===400||r.status===422){
    const fallback={...body}; delete (fallback as any).response_format;
    r=await fetch(url,{method:"POST",headers,body:JSON.stringify(fallback),cache:"no-store",signal:AbortSignal.timeout(110000)});
  }
  if(!r.ok)throw new Error(`LLM ${r.status}: ${(await r.text()).slice(0,500)}`);
  const data=await r.json();
  const content=data?.choices?.[0]?.message?.content??data?.message?.content??data?.output_text??data?.content;
  const parsed=typeof content==="object"?content:typeof content==="string"?extractJson(content):null;
  if(!parsed)throw new Error("Respuesta IA incompatible");
  return {parsed,model,usage:data?.usage||null,generation_id:data?.id||null};
}

export async function POST(req:Request){
  const db=getSupabase();
  if(!db)return NextResponse.json({error:"Control Central no configurado"},{status:503});
  try{
    const body=await req.json();
    const productId=String(body.product_id||"").trim();
    const objective=String(body.objective||"vender_solucion_b2b") as VideoObjective;
    const audience=String(body.audience||"prospecto_b2b") as VideoAudience;
    const aspectRatio=String(body.aspect_ratio||"9:16") as VideoAspectRatio;
    const language=String(body.language||"es") as VideoLanguage;
    const targetDuration=Math.max(15,Math.min(180,Number(body.target_duration||60)));
    if(!productId)return NextResponse.json({error:"product_id requerido"},{status:400});

    const {data:project,error:pError}=await db.from("projects").select("id,name,description,slug,phase,status,metadata").eq("id",productId).single();
    if(pError)throw pError;
    const [relations,memoryLinks,assets]=await Promise.all([
      db.from("entity_relations").select("target_type,target_key,relation,label,metadata").eq("source_type","project").eq("source_key",productId),
      db.from("memory_links").select("memory_id").eq("entity_type","project").eq("entity_key",productId),
      db.from("assets").select("id,kind,name,url,metadata").eq("project_id",productId).limit(24)
    ]);
    const memoryIds=(memoryLinks.data||[]).map((x:any)=>x.memory_id);
    const memories=memoryIds.length
      ? await db.from("deep_memories").select("kind,content,importance,structured_data").in("id",memoryIds).order("importance",{ascending:false}).limit(20)
      : {data:[]};

    const context={
      project:{name:project.name,description:project.description,slug:project.slug,phase:project.phase||project.status,product_type:project.metadata?.product_type||"digital_solution"},
      relations:relations.data||[],
      memories:(memories.data||[]).map((m:any)=>({kind:m.kind,content:String(m.content||"").slice(0,1800),importance:m.importance})),
      assets:(assets.data||[]).map((a:any)=>({kind:a.kind,name:a.name,url:a.url||null}))
    };

    const prompt=`OBJETIVO: ${objective}\nAUDIENCIA: ${audience}\nDURACIÓN OBJETIVO: ${targetDuration}s\nFORMATO: ${aspectRatio}\nIDIOMA: ${language}\n\nCONTEXTO REAL DE CONTROL CENTRAL\n${JSON.stringify(context,null,2)}\n\nGenera un storyboard comercial comprensible y fiel a los datos.`;
    const {parsed,model,usage,generation_id}=await callLLM(prompt);
    const scenes=Array.isArray(parsed.scenes)?parsed.scenes:[];
    if(!scenes.length)throw new Error("La IA no devolvió escenas");
    const storyboard:VideoStoryboard={
      title:String(parsed.title||project.name),
      hook:String(parsed.hook||""),
      objective,
      audience,
      target_duration:targetDuration,
      aspect_ratio:aspectRatio,
      language,
      scenes:scenes.map((s:any,i:number)=>({
        order:Number(s.order||i+1),
        purpose:String(s.purpose||""),
        headline:String(s.headline||""),
        screen_text:String(s.screen_text||""),
        narration:String(s.narration||""),
        visual_direction:String(s.visual_direction||""),
        duration:Math.max(1,Number(s.duration||Math.round(targetDuration/scenes.length)))
      })),
      cta:String(parsed.cta||"")
    };
    return NextResponse.json({ok:true,storyboard,meta:{model,usage,generation_id,source:"control_central",law:"no-fake"}});
  }catch(err:any){
    return NextResponse.json({error:err?.name==="TimeoutError"?"La generación excedió el tiempo disponible":err.message||"No se pudo generar el storyboard"},{status:400});
  }
}
