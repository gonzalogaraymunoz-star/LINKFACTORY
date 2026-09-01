"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { VideoStoryboard } from "@/lib/video/types";
import "./video-studio.css";

type Product={id:string;name:string;description?:string|null;slug:string};
type StatusResponse={video_explainer:boolean;storyboard_engine:boolean;renderer:{engine:string;configured:boolean;render_url:string|null;reason:string};law:string};

export default function VideoStudio(){
  const [products,setProducts]=useState<Product[]>([]);
  const [productId,setProductId]=useState("");
  const [status,setStatus]=useState<StatusResponse|null>(null);
  const [storyboard,setStoryboard]=useState<VideoStoryboard|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  const active=useMemo(()=>products.find(p=>p.id===productId)||null,[products,productId]);

  useEffect(()=>{
    Promise.all([
      fetch("/api/factory",{cache:"no-store"}).then(r=>r.json()),
      fetch("/api/video/status",{cache:"no-store"}).then(r=>r.json())
    ]).then(([factory,videoStatus])=>{
      const list=(factory.products||[]) as Product[];
      setProducts(list);
      if(list[0])setProductId(list[0].id);
      setStatus(videoStatus);
    }).catch(e=>setError(e.message||"No se pudo cargar LINK Factory"));
  },[]);

  async function generate(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(!productId||busy)return;
    const f=new FormData(e.currentTarget);
    setBusy(true);setError("");setStoryboard(null);
    try{
      const r=await fetch("/api/video/brief",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
        product_id:productId,
        objective:f.get("objective"),
        audience:f.get("audience"),
        target_duration:Number(f.get("duration")),
        aspect_ratio:f.get("aspect_ratio"),
        language:f.get("language")
      })});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||"No se pudo generar el storyboard");
      setStoryboard(j.storyboard);
    }catch(e:any){setError(e.message||"Error de generación")}finally{setBusy(false)}
  }

  return <main className="video-studio">
    <header className="video-hero">
      <div><p className="eyebrow">LINK Factory · Constructor de Videos</p><h1>Explicar antes de renderizar.</h1><p>Convierte el conocimiento real de Control Central en una narrativa B2B. HyperFrames queda desacoplado como motor de render.</p></div>
      <a className="back-link" href="/factory">← Volver a Factory</a>
    </header>

    <section className="status-grid">
      <article><span>Contexto</span><b>Control Central</b><small>Fuente de proyecto, relaciones, memoria y activos.</small></article>
      <article><span>Storyboard IA</span><b>{status?.storyboard_engine?"Disponible":"No configurado"}</b><small>{status?.storyboard_engine?"Usa el motor IA actual de LINK Factory.":"Falta OPEN_SOURCE_LLM_API_URL."}</small></article>
      <article><span>Motor de video</span><b>{status?.renderer.configured?"HyperFrames configurado":"Pendiente"}</b><small>{status?.renderer.reason||"Consultando estado real…"}</small></article>
      <article><span>Política</span><b>Ley del no fake</b><small>Ningún render se muestra listo sin archivo verificable.</small></article>
    </section>

    <section className="workspace">
      <form className="video-form" onSubmit={generate}>
        <h2>Orden de explicación</h2>
        <label>Producto<select value={productId} onChange={e=>setProductId(e.target.value)}>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label>Objetivo<select name="objective" defaultValue="vender_solucion_b2b"><option value="vender_solucion_b2b">Vender solución B2B</option><option value="explicar_aplicacion">Explicar aplicación</option><option value="mostrar_funcionamiento">Mostrar cómo funciona</option><option value="caso_real">Presentar caso real</option><option value="modelo_negocio">Explicar modelo de negocio</option><option value="product_demo">Product demo</option><option value="pitch">Pitch comercial</option><option value="propuesta">Propuesta</option></select></label>
        <label>Audiencia<select name="audience" defaultValue="prospecto_b2b"><option value="prospecto_b2b">Prospecto B2B</option><option value="dueno_empresa">Dueño de empresa</option><option value="gerencia">Gerencia</option><option value="equipo_comercial">Equipo comercial</option><option value="hotel">Hotel</option><option value="restaurante">Restaurante</option><option value="operador">Operador</option><option value="inversionista">Inversionista</option></select></label>
        <div className="form-row"><label>Duración<select name="duration" defaultValue="60"><option value="30">30 s</option><option value="60">60 s</option><option value="90">90 s</option><option value="120">2 min</option></select></label><label>Formato<select name="aspect_ratio" defaultValue="9:16"><option value="9:16">9:16</option><option value="16:9">16:9</option><option value="1:1">1:1</option></select></label></div>
        <label>Idioma<select name="language" defaultValue="es"><option value="es">Español</option><option value="pt-BR">Português BR</option><option value="en">English</option></select></label>
        <button className="primary" disabled={!productId||busy||!status?.storyboard_engine}>{busy?"Generando storyboard…":"Generar storyboard"}</button>
        {!status?.storyboard_engine&&<p className="guard">Generación bloqueada de forma explícita hasta configurar el motor IA.</p>}
        {error&&<p className="error">{error}</p>}
      </form>

      <section className="storyboard-panel">
        {!storyboard?<div className="empty-state"><span>Storyboard</span><h2>{active?active.name:"Selecciona un producto"}</h2><p>Primero generamos y revisamos la historia. El sistema no saltará directamente a un render.</p></div>:<>
          <div className="storyboard-head"><div><span>Storyboard generado</span><h2>{storyboard.title}</h2><p>{storyboard.hook}</p></div><div className="meta-pill">{storyboard.target_duration}s · {storyboard.aspect_ratio}</div></div>
          <div className="scene-list">{storyboard.scenes.map(scene=><article key={scene.order}><div className="scene-no">{String(scene.order).padStart(2,"0")}</div><div><small>{scene.purpose}</small><h3>{scene.headline}</h3><p>{scene.screen_text}</p><details><summary>Ver narración y dirección visual</summary><p><b>Narración:</b> {scene.narration}</p><p><b>Visual:</b> {scene.visual_direction}</p><p><b>Duración:</b> {scene.duration}s</p></details></div></article>)}</div>
          <div className="cta-box"><small>CTA</small><strong>{storyboard.cta||"Sin CTA definido"}</strong></div>
          <div className="render-gate"><button disabled={!status?.renderer.configured}>Renderizar con HyperFrames</button><p>{status?.renderer.configured?"Worker configurado. La siguiente fase conectará composición, cola y almacenamiento.":"Bloqueado: no existe un worker HyperFrames configurado. Esto evita simular un render inexistente."}</p></div>
        </>}
      </section>
    </section>
  </main>;
}
