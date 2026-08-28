import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

function slugify(v:string){return v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70)}

async function namespace(db:any){
  let q=await db.from("memory_namespaces").select("*").eq("scope_type","system").eq("scope_key","link_factory_capabilities").limit(1).maybeSingle();
  if(q.error)throw q.error;
  if(q.data)return q.data;
  const root=await db.from("controls").select("id").eq("is_root",true).limit(1).maybeSingle();
  const c=await db.from("memory_namespaces").insert({control_id:root.data?.id||null,scope_type:"system",scope_key:"link_factory_capabilities",label:"LINK Factory Capabilities",metadata:{source_app:"link-factory"}}).select().single();
  if(c.error)throw c.error; return c.data;
}

export async function GET(){
  const db=getSupabase(); if(!db)return NextResponse.json({custom:[]});
  try{
    const ns=await namespace(db);
    const q=await db.from("deep_memories").select("id,memory_key,content,structured_data,created_at").eq("namespace_id",ns.id).eq("kind","instruction").order("created_at",{ascending:true}).limit(200);
    if(q.error)throw q.error;
    const custom=(q.data||[]).map((m:any)=>m.structured_data).filter((x:any)=>x?.factory_capability===true&&["skill","style"].includes(x.kind)).map((x:any)=>({...x,builtin:false}));
    return NextResponse.json({custom});
  }catch{return NextResponse.json({custom:[]})}
}

export async function POST(req:Request){
  const db=getSupabase(); if(!db)return NextResponse.json({error:"Supabase no configurado"},{status:503});
  try{
    const body=await req.json(); const kind=body.kind==="style"?"style":"skill"; const name=String(body.name||"").trim(); if(!name)throw new Error("Nombre requerido");
    const description=String(body.description||"").trim().slice(0,500);
    const instructions=(Array.isArray(body.instructions)?body.instructions:String(body.instructions||"").split("\n")).map((x:any)=>String(x).trim()).filter(Boolean).slice(0,30).map((x:string)=>x.slice(0,1200));
    if(!instructions.length)throw new Error("Agrega al menos una instrucción");
    const ns=await namespace(db); const id=`custom-${kind}-${slugify(name)}-${Date.now().toString(36)}`;
    const structured={factory_capability:true,id,kind,name,description,instructions};
    const ins=await db.from("deep_memories").insert({namespace_id:ns.id,memory_key:id,kind:"instruction",content:`${name}\n${instructions.join("\n")}`,importance:4,source:"link-factory",structured_data:structured,metadata:{source_app:"link-factory",capability_type:kind}}).select("id").single();
    if(ins.error)throw ins.error; return NextResponse.json({ok:true,capability:{...structured,builtin:false}});
  }catch(err:any){return NextResponse.json({error:err.message||"No se pudo guardar la habilidad"},{status:400})}
}
