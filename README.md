# LINK Factory

LINK Factory es el estudio de fabricación digital del ecosistema LINK. Su activo principal es una **Preview viva** que puede modificarse conversando con una IA.

## Regla arquitectónica

- **Cada negocio/app:** repositorio GitHub propio + proyecto/deploy Vercel propio.
- **Memoria, relaciones, activos, versiones y estados:** Supabase de **LINK CONTROL CENTRAL**.
- Factory no crea una base Supabase nueva.
- El `service_role` se usa exclusivamente en rutas server-side de Next.js. Nunca se expone al navegador.

## Flujo principal

`Producto → HTML de trabajo → AI Edit → nueva versión → Preview instantánea → revisar/restaurar → aprobar → GitHub/Vercel`

La IA NO redespliega Vercel en cada edición. El HTML de trabajo vive en `design_previews` y sus snapshots en `design_versions` de Control Central.

## AI Edit

La ruta `POST /api/ai` espera un servidor LLM compatible con el formato de chat-completions de OpenAI.

Variables:

```bash
OPEN_SOURCE_LLM_API_URL=https://.../v1/chat/completions
OPEN_SOURCE_LLM_API_KEY=opcional
OPEN_SOURCE_LLM_MODEL=factory-editor
```

Factory envía al LLM:

- instrucciones de edición segura;
- producto activo;
- negocio(s) asociados;
- memoria relevante de Control Central;
- HTML actual;
- instrucción del usuario.

El LLM debe devolver JSON:

```json
{
  "summary": "Resumen breve del cambio",
  "html": "<!doctype html>..."
}
```

Si el endpoint tiene otro formato, adapta únicamente `app/api/ai/route.ts`; el resto de Factory no cambia.

## Comunicación con Control Central

Factory utiliza:

- `projects`: identidad de cada producto Factory (`kind = factory_product`).
- `design_previews`: HTML de trabajo actual.
- `design_versions`: historial inmutable de versiones.
- `project_integrations`: GitHub, Vercel, Drive y demás links verificables.
- `entity_relations`: producto ↔ negocio/cliente y relaciones futuras.
- `memory_namespaces`, `deep_memories`, `memory_links`: memoria profunda.
- `assets`: activos asociados.
- `event_bus`: eventos de creación, edición IA, aprobación, restauración y conexiones.

## Subir a GitHub

1. Crea un repositorio vacío llamado `LINK-FACTORY`.
2. Sube el contenido de esta carpeta a la raíz.
3. Importa ese repositorio como proyecto nuevo en Vercel.
4. Agrega las variables de `.env.example`.
5. Usa Node 22+.
6. Ejecuta `npm install` y `npm run build`.

## Ley anti-fake

- No hay productos demo sembrados.
- Los links externos nacen desconectados y deben verificarse.
- Una integración no se presenta como operativa solo porque tenga una URL guardada.
- El estado de la IA indica `pendiente` hasta que `OPEN_SOURCE_LLM_API_URL` exista.
- Cada cambio de IA crea una versión recuperable antes de tocar producción.
