#!/usr/bin/env node
/**
 * LINK REA Runner v1
 * Host-side adapter. Run on a machine that has Node 22.19+ and REA available.
 * It intentionally executes only allow-listed REA CLI operations.
 */
import http from "node:http";
import {spawn} from "node:child_process";
import {randomUUID} from "node:crypto";
const PORT=Number(process.env.PORT||8787),TOKEN=process.env.REA_RUNNER_TOKEN;
if(!TOKEN)throw new Error("REA_RUNNER_TOKEN is required");
const allowed={DISCOVER:"analyze",DIAGNOSE:"inspect",VERIFY:"inspect"};
function runRea(mode,target){
 return new Promise((resolve,reject)=>{
  const command=allowed[mode];if(!command)return reject(new Error("Unsupported mode"));
  const child=spawn("npx",["-y","rea-agents@4.0.1",command,target,"--json"],{stdio:["ignore","pipe","pipe"],env:process.env});
  let out="",err="";child.stdout.on("data",d=>out+=d);child.stderr.on("data",d=>err+=d);
  const timer=setTimeout(()=>{child.kill("SIGTERM");reject(new Error("REA timeout"))},120000);
  child.on("close",code=>{clearTimeout(timer);if(code!==0)return reject(new Error(err||"REA exited "+code));try{resolve(JSON.parse(out))}catch{resolve({raw:out})}});
 });
}
http.createServer(async(req,res)=>{
 res.setHeader("content-type","application/json");
 if(req.headers.authorization!=="Bearer "+TOKEN){res.statusCode=401;return res.end(JSON.stringify({error:"unauthorized"}))}
 if(req.method==="GET"&&req.url==="/health")return res.end(JSON.stringify({ok:true,runner:"link-rea-runner",rea:"4.0.1"}));
 if(req.method!=="POST"||req.url!=="/v1/investigations"){res.statusCode=404;return res.end(JSON.stringify({error:"not_found"}))}
 let raw="";for await(const c of req)raw+=c;
 const started_at=new Date().toISOString();
 try{const body=JSON.parse(raw),result=await runRea(body.mode,body.target.location);
  const evidence=Array.isArray(result?.evidence)?result.evidence.map((e,i)=>({kind:e.kind||"rea",label:e.label||e.title||("Evidence "+(i+1)),location:e.location,metadata:e})): [{kind:"rea_result",label:"REA structured result",metadata:result}];
  res.end(JSON.stringify({id:randomUUID(),status:"completed",mode:body.mode,objective:body.objective,summary:result?.summary||"REA completed the requested investigation.",findings:Array.isArray(result?.findings)?result.findings:[],evidence,limitations:Array.isArray(result?.limitations)?result.limitations:[],started_at,completed_at:new Date().toISOString(),runner:{name:"link-rea-runner",version:"4.0.1"}}));
 }catch(e){res.statusCode=500;res.end(JSON.stringify({error:String(e?.message||e)}))}
}).listen(PORT,"127.0.0.1",()=>process.stdout.write("LINK REA Runner listening on 127.0.0.1:"+PORT+"\n"));
