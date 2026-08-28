import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const SYSTEM = `Eres LINK Factory AI Edit. Tu trabajo es editar HTML/CSS/JS de una página web existente siguiendo exactamente la instrucción del usuario.
REGLAS:
1. Devuelve SIEMPRE JSON válido, sin markdown, con las claves summary, request_summary y html.
2. html debe ser un documento HTML completo listo para iframe.
3. Conserva todo lo que el usuario no pidió cambiar. No borres funcionalidad sin motivo.
4. Prioriza diseño responsive, accesibilidad, jerarquía visual y claridad comercial.
5. No agregues dependencias externas salvo que ya existan en el HTML.
6. No inventes datos comerciales, testimonios, métricas, clientes, precios ni integraciones. Si faltan, usa placeholders explícitos o conserva el contenido actual.
7. No introduzcas scripts que accedan al parent, cookies, localStorage sensible, red privada o credenciales.
8. summary debe explicar en una frase qué cambió en esta versión.
9. request_summary debe resumir en 1 a 3 frases lo que solicita el prompt del usuario, preservando objetivo, público, formato, contenido, restricciones y estilo cuando estén presentes.`;

type GenerationData={
  model:string;
  provider:string;
  temperature:number;
  generated_at:string;
  generation_id?:string|null;
  created?:number|null;
  usage?:{prompt_tokens?:number|null;completion_tokens?:number|null;total_tokens?:number|null}|null;
};

function extractJson(raw:string){
  const clean=raw.trim().replace(/^```json\s*/i,'').replace(/```$/,'').trim();
  try{return JSON.parse(clean)}catch{}
  const start=clean.indexOf('{'),end=clean.lastIndexOf('}');
  if(start>=0&&end>start)return JSON.parse(clean.slice(start,end+1));
  throw new Error('El LLM no devolvió JSON válido');
}

async function callLLM(messages:any[]):Promise<{result:any;generation:GenerationData}>{
  const url=process.env.OPEN_SOURCE_LLM_API_URL;
  if(!url) throw new Error('OPEN_SOURCE_LLM_API_URL no configurado');
  const headers:Record<string,string>={'content-type':'application/json'};
  if(process.env.OPEN_SOURCE_LLM_API_KEY) headers.authorization=`Bearer ${process.env.OPEN_SOURCE_LLM_API_KEY}`;
  const temperature=0.2;
  const requestedModel=process.env.OPEN_SOURCE_LLM_MODEL||'factory-editor';
  const base={model:requestedModel,messages,temperature};
  let r=await fetch(url,{method:'POST',headers,body:JSON.stringify({...base,response_format:{type:'json_object'}}),cache:'no-store',signal:AbortSignal.timeout(90000)});
  // Algunos servidores OpenAI-compatible implementan chat-completions pero no response_format.
  if(r.status===400||r.status===422) r=await fetch(url,{method:'POST',headers,body:JSON.stringify(base),cache:'no-store',signal:AbortSignal.timeout(90000)});
  if(!r.ok) throw new Error(`LLM ${r.status}: ${(await r.text()).slice(0,500)}`);
  const data=await r.json();
  const content=data?.choices?.[0]?.message?.content ?? data?.message?.content ?? data?.output_text ?? data?.content;
  let result:any;
  if(typeof content==='object') result=content;
  else if(typeof content==='string') result=extractJson(content);
  else throw new Error('Respuesta LLM incompatible. Usa protocolo OpenAI-compatible o adapta app/api/ai/route.ts');
  let provider='openai-compatible';
  try{provider=new URL(url).hostname}catch{}
  const usage=data?.usage?{
    prompt_tokens:Number(data.usage.prompt_tokens ?? data.usage.input_tokens ?? 0)||null,
    completion_tokens:Number(data.usage.completion_tokens ?? data.usage.output_tokens ?? 0)||null,
    total_tokens:Number(data.usage.total_tokens ?? 0)||null
  }:null;
  return {
    result,
    generation:{
      model:String(data?.model||requestedModel),provider,temperature,
      generated_at:new Date().toISOString(),generation_id:data?.id?String(data.id):null,
      created:Number.isFinite(Number(data?.created))?Number(data.created):null,usage
    }
  };
}

export async function POST(req:Request){
  const db=getSupabase(); if(!db) return NextResponse.json({error:'Supabase de Control Central no configurado'},{status:503});
  try{
    const {product_id,instruction}=await req.json();
    const cleanInstruction=String(instruction||'').trim();
    if(!product_id||!cleanInstruction) throw new Error('Producto e instrucción requeridos');
    const [{data:project,error:pError},{data:design,error:dError}]=await Promise.all([
      db.from('projects').select('*').eq('id',product_id).single(),
      db.from('design_previews').select('*').eq('project_id',product_id).eq('creation_type','factory_html').order('updated_at',{ascending:false}).limit(1).single()
    ]);
    if(pError) throw pError; if(dError) throw dError;
    const [relations,memLinks]=await Promise.all([
      db.from('entity_relations').select('target_type,target_key,relation,label,metadata').eq('source_type','project').eq('source_key',product_id),
      db.from('memory_links').select('memory_id').eq('entity_type','project').eq('entity_key',product_id)
    ]);
    const memoryIds=(memLinks.data||[]).map((x:any)=>x.memory_id);
    const memories=memoryIds.length?await db.from('deep_memories').select('kind,content,importance,structured_data').in('id',memoryIds).order('importance',{ascending:false}).limit(12):{data:[]};
    const context={product:{name:project.name,description:project.description,product_type:project.metadata?.product_type,phase:project.phase},businesses:relations.data||[],memories:memories.data||[],current_version:design.current_version};
    const {result,generation}=await callLLM([{role:'system',content:SYSTEM},{role:'user',content:`CONTEXTO DEL PRODUCTO:\n${JSON.stringify(context)}\n\nINSTRUCCIÓN:\n${cleanInstruction}\n\nHTML ACTUAL:\n${design.html}`}]);
    if(!result?.html||typeof result.html!=='string'||!/<html[\s>]/i.test(result.html)) throw new Error('La IA no devolvió un documento HTML completo');
    const nextVersion=Number(design.current_version||0)+1;
    const summary=String(result.summary||'Edición generada por IA').slice(0,500);
    const requestSummary=String(result.request_summary||summary).slice(0,1200);
    const generationMetadata={
      source_app:'link-factory',instruction:cleanInstruction.slice(0,12000),request_summary:requestSummary,
      model:generation.model,provider:generation.provider,temperature:generation.temperature,generated_at:generation.generated_at,
      generation_id:generation.generation_id||null,created:generation.created||null,usage:generation.usage||null
    };
    const v=await db.from('design_versions').insert({design_id:design.id,version_number:nextVersion,html:result.html,change_summary:summary,source:'link-factory-ai',metadata:generationMetadata}); if(v.error) throw v.error;
    const u=await db.from('design_previews').update({html:result.html,current_version:nextVersion,status:'draft',updated_at:generation.generated_at,metadata:{...(design.metadata||{}),last_ai_edit_at:generation.generated_at,last_generation:{version:nextVersion,...generationMetadata}}}).eq('id',design.id); if(u.error) throw u.error;

    const previousMeta=project.metadata||{};
    const firstPrompt=previousMeta.factory_request_prompt||cleanInstruction;
    const firstSummary=previousMeta.factory_request_summary||requestSummary;
    const projectUpdate:any={
      updated_at:generation.generated_at,
      metadata:{
        ...previousMeta,
        factory_request_prompt:firstPrompt,
        factory_request_summary:firstSummary,
        first_generation_at:previousMeta.first_generation_at||generation.generated_at,
        first_generation_model:previousMeta.first_generation_model||generation.model,
        last_generation_at:generation.generated_at,
        last_generation_model:generation.model,
        last_generation_version:nextVersion
      }
    };
    if(!project.description) projectUpdate.description=firstSummary;
    const pUpdate=await db.from('projects').update(projectUpdate).eq('id',product_id); if(pUpdate.error) throw pUpdate.error;

    const {data:control}=await db.from('controls').select('id').eq('is_root',true).limit(1).maybeSingle();
    if(control?.id) await db.from('event_bus').insert({control_id:control.id,source_provider:'link_factory',event_type:'factory.ai.edit_applied',entity_type:'project',global_id:product_id,dedupe_key:`factory:ai:${product_id}:${nextVersion}:${Date.now()}`,payload:{version:nextVersion,summary,request_summary:requestSummary,instruction:cleanInstruction.slice(0,1000),generation:{model:generation.model,provider:generation.provider,usage:generation.usage}}});
    return NextResponse.json({ok:true,version:nextVersion,summary,request_summary:requestSummary,generation});
  }catch(err:any){return NextResponse.json({error:err.message||'Error AI Edit'},{status:400})}
}
