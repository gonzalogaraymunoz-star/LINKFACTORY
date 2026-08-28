import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export type FactoryReference={id:string;label:string;url:string;role:string;notes?:string};
export type FactoryConfig={active_skills:string[];active_style:string|null;references:FactoryReference[];custom_rules:string[];notify:boolean;sound:boolean};

const EMPTY:FactoryConfig={active_skills:["mobile-first","accessibility"],active_style:"link-minimal",references:[],custom_rules:[],notify:true,sound:true};

function cleanConfig(value:any):FactoryConfig{
  const refs=Array.isArray(value?.references)?value.references.slice(0,20).map((r:any)=>({
    id:String(r?.id||crypto.randomUUID()).slice(0,120),label:String(r?.label||"Referencia").slice(0,160),url:String(r?.url||"").slice(0,2000),role:String(r?.role||"inspiration").slice(0,80),notes:String(r?.notes||"").slice(0,1200)
  })).filter((r:any)=>r.url):[];
  for(const r of refs){const u=new URL(r.url);if(u.protocol!=="https:")throw new Error("Las referencias deben usar HTTPS");}
  return {
    active_skills:Array.isArray(value?.active_skills)?value.active_skills.map(String).slice(0,20):EMPTY.active_skills,
    active_style:value?.active_style?String(value.active_style):null,
    references:refs,
    custom_rules:Array.isArray(value?.custom_rules)?value.custom_rules.map((x:any)=>String(x).slice(0,1200)).filter(Boolean).slice(0,20):[],
    notify:value?.notify!==false,
    sound:value?.sound!==false
  };
}

export async function GET(req:Request){
  const db=getSupabase(); if(!db)return NextResponse.json({error:"Supabase no configurado"},{status:503});
  const id=new URL(req.url).searchParams.get("product_id"); if(!id)return NextResponse.json({error:"product_id requerido"},{status:400});
  const {data,error}=await db.from("projects").select("id,metadata").eq("id",id).single();
  if(error)return NextResponse.json({error:error.message},{status:404});
  try{return NextResponse.json({config:cleanConfig(data?.metadata?.factory_config||EMPTY)})}catch{return NextResponse.json({config:EMPTY})}
}

export async function POST(req:Request){
  const db=getSupabase(); if(!db)return NextResponse.json({error:"Supabase no configurado"},{status:503});
  try{
    const body=await req.json(); const productId=String(body.product_id||""); if(!productId)throw new Error("product_id requerido");
    const config=cleanConfig(body.config||{});
    const {data:project,error}=await db.from("projects").select("metadata").eq("id",productId).single(); if(error)throw error;
    const metadata={...(project?.metadata||{}),factory_config:config,factory_config_updated_at:new Date().toISOString()};
    const updated=await db.from("projects").update({metadata,updated_at:new Date().toISOString()}).eq("id",productId); if(updated.error)throw updated.error;
    return NextResponse.json({ok:true,config});
  }catch(err:any){return NextResponse.json({error:err.message||"No se pudo guardar la configuración"},{status:400})}
}
