import type { VideoStatus } from "./types";

export const NO_FAKE_RULES = [
  "No declarar un render como listo si no existe un archivo verificable.",
  "No declarar HyperFrames conectado si no existe un worker configurado.",
  "No inventar métricas, clientes, resultados, costos ni integraciones.",
  "No presentar placeholders como datos reales.",
  "Todo estado visible debe derivar de datos persistidos o configuración verificable.",
  "Todo artefacto debe conservar proyecto, versión, motor, fecha y estado."
] as const;

export function assertReadyHasArtifact(status: VideoStatus, publicUrl?: string | null) {
  if ((status === "ready" || status === "approved") && !publicUrl) {
    throw new Error("Ley anti-fake: un video listo debe tener un artefacto verificable.");
  }
}

export function publicRenderState(input: {
  status?: VideoStatus | null;
  publicUrl?: string | null;
}) {
  const status = input.status || "draft";
  if ((status === "ready" || status === "approved") && !input.publicUrl) return "failed" as VideoStatus;
  return status;
}
