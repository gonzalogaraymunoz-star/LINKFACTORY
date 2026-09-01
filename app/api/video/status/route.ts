import { NextResponse } from "next/server";
import type { VideoEngineStatus } from "@/lib/video/types";

export async function GET(){
  const renderUrl=(process.env.HYPERFRAMES_RENDER_URL||"").trim();
  const configured=Boolean(renderUrl);
  const status:VideoEngineStatus={
    engine:"hyperframes",
    configured,
    render_url:configured?renderUrl:null,
    reason:configured
      ?"Worker HyperFrames configurado mediante HYPERFRAMES_RENDER_URL."
      :"Render pendiente: HYPERFRAMES_RENDER_URL no está configurado."
  };
  return NextResponse.json({
    video_explainer:true,
    storyboard_engine:Boolean(process.env.OPEN_SOURCE_LLM_API_URL),
    renderer:status,
    law:"no-fake"
  },{headers:{"cache-control":"no-store"}});
}
