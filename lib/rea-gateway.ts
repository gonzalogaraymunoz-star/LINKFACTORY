export type ReaMode="DISCOVER"|"DIAGNOSE"|"VERIFY";
export type InvestigationRequest={mission_id:string;product_id?:string;mode:ReaMode;objective:string;target:{kind:"artifact"|"website"|"browser"|"process"|"native";location:string};context?:Record<string,unknown>};
export type InvestigationReport={id:string;status:"completed"|"partial"|"failed"|"runner_offline";mode:ReaMode;objective:string;summary:string;findings:Array<{title:string;detail:string;confidence?:number}>;evidence:Array<{kind:string;label:string;location?:string;metadata?:Record<string,unknown>}>;limitations:string[];started_at:string;completed_at?:string;runner?:{name:string;version?:string}};

export function reaRunnerConfig(){
 const url=process.env.REA_RUNNER_URL?.replace(/\/$/,"");
 const token=process.env.REA_RUNNER_TOKEN;
 return {url,token,configured:Boolean(url&&token)};
}
export async function callReaRunner(request:InvestigationRequest):Promise<InvestigationReport>{
 const cfg=reaRunnerConfig(),started_at=new Date().toISOString();
 if(!cfg.configured)return {id:crypto.randomUUID(),status:"runner_offline",mode:request.mode,objective:request.objective,summary:"REA Runner no está conectado a este despliegue.",findings:[],evidence:[],limitations:["Configura REA_RUNNER_URL y REA_RUNNER_TOKEN en Factory. REA analiza localmente; Vercel solo orquesta y muestra evidencia."],started_at};
 const r=await fetch(cfg.url+"/v1/investigations",{method:"POST",headers:{"content-type":"application/json","authorization":"Bearer "+cfg.token},body:JSON.stringify(request),cache:"no-store"});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(data?.error||("REA Runner respondió "+r.status));
 return data as InvestigationReport;
}
