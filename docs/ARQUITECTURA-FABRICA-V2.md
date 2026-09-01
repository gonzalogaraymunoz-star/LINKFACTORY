# LINK Factory V2 — Arquitectura de fabricación

## Principio

LINK Factory es un brazo de fabricación de LINK Control Central. Control Central conserva gobierno, memoria, relaciones y estados. Factory fabrica artefactos a partir de ese contexto.

```text
CONVERSACIÓN / DESCUBRIMIENTO
          │
          ▼
   CONTROL CENTRAL
      (cerebro)
          │
          ├── negocios
          ├── proyectos
          ├── relaciones
          ├── memoria
          ├── activos
          └── eventos
          │
          ▼
   NÚCLEO DE CONTEXTO
          │
          ▼
      LINK FACTORY
          │
     PLANIFICADOR
          │
   ORDEN DE FABRICACIÓN
          │
   ┌──────┼────────┬─────────┐
   ▼      ▼        ▼         ▼
 Web/App Video  Documentos Presentaciones
          │
          ▼
 Constructor de Videos
          │
       VideoEngine
          │
      HyperFrames
```

## Todo lo fabricado es una solución

Factory no parte preguntando qué app construir. Parte desde problema, contexto, solución y forma de comunicarla. Website, aplicación, video o documento son representaciones de una solución.

Flujo base:

`Conversar → Comprender → Definir → Documentar → Fabricar → Probar → Explicar → Publicar → Aprender → Reutilizar`

## Contratos

### Contexto de fabricación

Debe derivar de Control Central e incluir sólo información real disponible:

- proyecto;
- negocio y relaciones;
- memoria vinculada;
- activos;
- referencias verificables;
- branding cuando exista;
- instrucciones y reglas;
- versiones relevantes.

Los constructores no deben crear una memoria paralela desconectada.

### Orden de fabricación

Toda fabricación debe registrar como mínimo:

- proyecto;
- tipo de artefacto;
- objetivo;
- audiencia cuando corresponda;
- constructor;
- motor;
- estado;
- versión;
- timestamps;
- resultado o error verificable.

### Resultado

Un resultado no existe por haber sido solicitado. Sólo existe cuando hay un artefacto verificable o un estado intermedio real.

## Constructor de Videos

El Constructor de Videos es una capacidad de Factory. HyperFrames es un motor intercambiable dentro de esa capacidad.

```text
Control Central
  ↓
Contexto real
  ↓
Storyboard IA
  ↓
Revisión
  ↓
Composición
  ↓
Worker de render
  ↓
HyperFrames + FFmpeg
  ↓
Archivo verificable
  ↓
Storage + versión + evento
```

Estados permitidos:

- `draft`
- `storyboard`
- `composition_ready`
- `render_pending`
- `rendering`
- `ready`
- `failed`
- `approved`

`ready` y `approved` requieren un artefacto verificable.

## Ley del no fake

Esta ley es transversal e inmutable.

1. No inventar clientes, métricas, testimonios, precios, costos, resultados, archivos o integraciones.
2. No mostrar una integración como conectada por tener solamente una URL o configuración parcial.
3. No mostrar un render como terminado sin archivo verificable.
4. No mostrar un deploy como producción sin una integración/deploy real verificado.
5. No presentar placeholders como información real.
6. Todo estado operativo visible debe derivar de datos persistidos o configuración verificable.
7. Los errores y estados pendientes se muestran explícitamente; nunca se maquillan como éxito.
8. Cada artefacto conserva trazabilidad: proyecto → orden → constructor → motor → versión → estado → archivo.
9. Ningún constructor puede saltarse Control Central para inventar contexto.
10. Una capacidad no configurada se muestra como `pendiente` o `no configurada`, no como disponible.

## Biblioteca y conocimiento

Todo resultado aprobado vuelve al ecosistema y queda relacionado con el negocio/proyecto correspondiente. Los archivos pueden residir en Drive, Supabase Storage o GitHub según su naturaleza; Control Central conserva el mapa de conocimiento y relaciones.

## Video Explainer MVP

Primera fase implementada:

- ruta `/factory/video`;
- lectura de productos desde Factory/Control Central;
- configuración de objetivo, audiencia, duración, formato e idioma;
- generación real de storyboard mediante el motor IA configurado;
- endpoint `/api/video/status` para declarar capacidades reales;
- render HyperFrames bloqueado si no existe `HYPERFRAMES_RENDER_URL`;
- contratos TypeScript y guardas anti-fake.

Pendiente antes de declarar render operativo:

1. worker HyperFrames real;
2. endpoint de composición;
3. persistencia de proyectos/versiones de video;
4. almacenamiento del MP4;
5. evento de render completado;
6. validación de artefacto antes de estado `ready`.

Mientras estos puntos no existan, la interfaz debe decirlo explícitamente.
