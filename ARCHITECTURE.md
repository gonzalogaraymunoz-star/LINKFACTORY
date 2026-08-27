# LINK Factory — Arquitectura

## Separación de responsabilidades

```text
ChatGPT / usuario
      │
      ▼
LINK FACTORY (repo + Vercel propios)
      │
      ├── Preview Workspace
      ├── AI Edit
      ├── Versionado
      └── Gateway Control Central
      │
      ├──────────────► Servidor LLM open source (Vercel separado)
      │
      ▼
SUPABASE LINK CONTROL CENTRAL
      │
      ├── projects
      ├── design_previews
      ├── design_versions
      ├── assets
      ├── project_integrations
      ├── entity_relations
      ├── deep_memories
      ├── memory_links
      └── event_bus
```

## Protocolo AI Edit

1. El usuario escribe una instrucción en la misma pantalla que la Preview.
2. `/api/ai` carga HTML + producto + relaciones + memorias desde Control Central.
3. El servidor LLM devuelve `{summary, html}`.
4. Factory valida que exista un documento HTML completo.
5. Se crea `design_versions vN+1`.
6. Se actualiza `design_previews` como working copy.
7. Se registra `factory.ai.edit_applied` en `event_bus`.
8. El iframe interno se recarga y refleja vN+1.
9. Versiones anteriores pueden restaurarse.
10. `Aprobar versión` cambia el estado, pero no inventa un deploy. La automatización GitHub/Vercel es una capa posterior.

## Gateway con Control Central

Factory jamás importa código de LINKCONTROLGENERAL. La comunicación es exclusivamente por contratos de datos de Supabase y, a futuro, command/event bus. Esto permite que todos los negocios mantengan repos/deploys independientes sin fragmentar la memoria del ecosistema.
