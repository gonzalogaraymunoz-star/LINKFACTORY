export type VideoObjective =
  | "explicar_aplicacion"
  | "vender_solucion_b2b"
  | "mostrar_funcionamiento"
  | "caso_real"
  | "modelo_negocio"
  | "product_demo"
  | "pitch"
  | "propuesta";

export type VideoAudience =
  | "dueno_empresa"
  | "gerencia"
  | "equipo_comercial"
  | "hotel"
  | "restaurante"
  | "operador"
  | "inversionista"
  | "prospecto_b2b"
  | "personalizada";

export type VideoAspectRatio = "9:16" | "16:9" | "1:1";
export type VideoLanguage = "es" | "pt-BR" | "en";
export type VideoStatus =
  | "draft"
  | "storyboard"
  | "composition_ready"
  | "render_pending"
  | "rendering"
  | "ready"
  | "failed"
  | "approved";

export type VideoScene = {
  order: number;
  purpose: string;
  headline: string;
  screen_text: string;
  narration: string;
  visual_direction: string;
  duration: number;
};

export type VideoStoryboard = {
  title: string;
  hook: string;
  objective: VideoObjective;
  audience: VideoAudience;
  target_duration: number;
  aspect_ratio: VideoAspectRatio;
  language: VideoLanguage;
  scenes: VideoScene[];
  cta: string;
};

export type VideoEngineStatus = {
  engine: "hyperframes";
  configured: boolean;
  render_url: string | null;
  reason: string;
};
