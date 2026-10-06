import { NextRequest,NextResponse } from "next/server";
import { callReaRunner,reaRunnerConfig,type InvestigationRequest,type ReaMode } from "@/lib/rea-gateway";
export const dynamic="force-dynamic";
const MODES=new Set<ReaMode>(["DISCOVER","DIAGNOSE","VERIFY"]);
export async function GET(){const c=reaRunnerConfig();return NextResponse.json({ok:true,technology:"REA",version:"4.0.1",role:"Instrumento de investigación de GÉNESIS dentro de LINK Factory",runner:{configured:c.configured,status:c.configured?"configured":"offline"},modes:[...MODES],boundary:"REA ejecuta análisis en un host local compatible. Factory/Vercel orquesta, visualiza y conserva evidencia."})}
export async function POST(req:NextRequest){
 try{const body=await req.json() as InvestigationRequest;
  if(!body?.mission_id||!body?.objective||!body?.target?.location||!MODES.has(body.mode))return NextResponse.json({error:"mission_id, mode, objective y target.location son obligatorios"},{status:400});
  const report=await callReaRunner(body);
  return NextResponse.json({ok:report.status!=="failed",report},{status:report.status==="runner_offline"?503:200});
 }catch(e:any){return NextResponse.json({ok:false,error:e?.message||"REA investigation failed"},{status:502})}
}
