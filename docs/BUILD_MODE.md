# LINK Factory · Build Mode

LINK Factory compila el contexto de una construcción antes de llamar al modelo:

`PROMPT + REGLAS LINK + SKILLS + STYLE PACK + REFERENCIAS + NEGOCIOS + MEMORIA + HTML ACTUAL`

## Cómo agregar una habilidad

En **Build Setup → Habilidades → + Nueva** crea una habilidad reutilizable.

Una habilidad debe describir **cómo debe saber construir**, no solo cómo debe verse.

Formato recomendado:

- **Nombre:** Landing de conversión para hoteles
- **Descripción:** Ordena una landing hotelera para reducir fricción y llevar a reserva.
- **Instrucciones:** una regla por línea.

Ejemplo:

```text
El CTA principal debe ser visible antes del primer scroll.
Mostrar contexto de ubicación, inclusiones y próximos pasos antes de pedir datos.
No mostrar más de un CTA primario por sección.
En móvil, los targets interactivos deben medir al menos 44 px.
Si faltan precios o disponibilidad, no inventarlos.
```

Al guardar una habilidad, Factory la conserva en la memoria central de capacidades y queda disponible para futuras construcciones.

## Cómo agregar un Style Pack

En **Build Setup → Style Pack → + Nuevo** cambia el tipo a `Style Pack`.

Un Style Pack describe dirección visual: tipografía, espaciado, color, densidad, bordes, fotografía, motion y composición.

## Cómo usar referencias

En **Build Setup → Referencias → + Agregar** pega una URL HTTPS y define para qué se usa:

- Inspiración general
- Layout
- Estilo visual
- UX
- Contenido
- Motion

En el campo de notas explica qué debe aprender de la referencia y qué no debe copiar.

Ejemplo:

```text
Tomar el ritmo editorial, uso del espacio y navegación.
No copiar textos, marca, fotografías ni paleta exacta.
```

Factory intenta leer referencias web de texto/HTML y agrega su contenido recuperado al prompt compilado. Las referencias binarias o visuales quedan guiadas por su URL y notas hasta incorporar un pipeline multimodal específico.

## Reglas propias

Las reglas propias se agregan encima de las reglas inmutables de LINK. Úsalas para restricciones del cliente o producto.

Ejemplos:

```text
Nunca mostrar precios sin IVA.
La reserva siempre debe terminar en el formulario oficial.
No modificar el logo aprobado.
```

## Pantalla ampliada

`Build Mode` abre el preview a pantalla completa y muestra un dock con:

- AI Edit
- Skills
- Estilo
- Referencias
- Comparar
- Desktop / Mobile
- Prompt compilado
- Código
- Versiones
- Salir

## Progreso y notificaciones

La generación reporta etapas y porcentaje. Durante la llamada larga al modelo, el porcentaje entre generación y validación es estimado; las demás etapas corresponden a pasos reales del pipeline.

Al terminar puede emitir:

- confirmación dentro de Factory;
- sonido opcional;
- notificación del navegador;
- cambio temporal del título de la pestaña.

## Trazabilidad

Cada versión generada guarda:

- prompt original;
- resumen de solicitud;
- prompt compilado;
- skills activas;
- style pack;
- referencias;
- modelo y proveedor;
- temperatura;
- usage/tokens si el proveedor los reporta;
- fecha de generación;
- versión y resumen del cambio.
