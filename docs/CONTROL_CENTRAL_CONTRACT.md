# Contrato de datos con LINK CONTROL CENTRAL

Factory no administra una base propia. Este documento define el contrato mínimo que espera encontrar en el Supabase central.

## Tablas leídas/escritas

| Tabla | Uso en Factory |
|---|---|
| `controls` | Resolver Control Central raíz |
| `projects` | Identidad del producto (`kind=factory_product`) |
| `design_previews` | Working HTML actual |
| `design_versions` | Snapshots/versionado del HTML |
| `project_integrations` | Links GitHub/Vercel/Drive/etc. |
| `entity_relations` | Producto ↔ negocio/cliente |
| `clients` | Resolver negocios ya existentes |
| `assets` | Conteo/activos futuros |
| `memory_namespaces` | Namespace de memoria por producto |
| `deep_memories` | Contexto, decisiones y reglas |
| `memory_links` | Memoria ↔ producto |
| `event_bus` | Auditoría/eventos de Factory |

## Identidad

Un producto Factory es un registro en `projects` con:

```json
{
  "kind": "factory_product",
  "metadata": {
    "source_app": "link-factory",
    "storage_policy": "control-central"
  }
}
```

## Eventos emitidos

- `factory.product.created`
- `factory.integration.added`
- `factory.integration.verified`
- `factory.business.linked`
- `factory.memory.created`
- `factory.ai.edit_applied`
- `factory.version.restored`
- `factory.version.approved`

Este contrato permite que Control Central observe Factory sin compartir el repositorio ni el deploy.
