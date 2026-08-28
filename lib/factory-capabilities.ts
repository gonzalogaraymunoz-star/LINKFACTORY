export type FactoryCapability={
  id:string;
  kind:"skill"|"style";
  name:string;
  description:string;
  instructions:string[];
  builtin?:boolean;
};

export const FACTORY_RULES=[
  "No inventar precios, métricas, testimonios, clientes, certificaciones ni integraciones.",
  "Conservar contenido y funcionalidad que el usuario no pidió modificar.",
  "Todo resultado debe ser responsive y usable en móvil, tablet y escritorio.",
  "Priorizar accesibilidad: contraste, foco visible, semántica, labels y navegación por teclado.",
  "No exponer credenciales, cookies, secretos, endpoints privados ni información sensible.",
  "No agregar dependencias externas salvo que la construcción ya las use o sean estrictamente necesarias.",
  "Mantener HTML completo, autocontenido y listo para ejecutarse dentro del iframe de LINK Factory.",
  "Cuando falte un dato real, usar un placeholder explícito y no presentarlo como hecho.",
  "Las referencias orientan la solución; no se deben copiar marcas, textos o interfaces de forma literal.",
  "Cada cambio debe preservar trazabilidad: prompt, skills, estilo, referencias, modelo, versión y resumen."
];

export const BUILTIN_SKILLS:FactoryCapability[]=[
  {id:"mobile-first",kind:"skill",name:"Mobile First",description:"Construye primero para teléfono y escala con criterio a pantallas mayores.",builtin:true,instructions:["Diseña la jerarquía principal para 320–430 px antes de expandir.","Evita overflow horizontal y targets menores a 44 px.","Usa tipografía, espaciado y navegación adaptativos."]},
  {id:"conversion-landing",kind:"skill",name:"Landing de conversión",description:"Ordena el contenido para comprensión rápida y acción clara.",builtin:true,instructions:["Una propuesta de valor principal sobre el fold.","Jerarquía: problema/beneficio → prueba/contexto → oferta → CTA.","Evita CTAs competidores y reduce fricción.","El CTA principal debe ser visible y específico."]},
  {id:"editorial-design",kind:"skill",name:"Diseño editorial",description:"Da ritmo, jerarquía tipográfica y composición con intención.",builtin:true,instructions:["Usa escalas tipográficas marcadas y whitespace deliberado.","Evita tarjetas repetitivas si una composición editorial comunica mejor.","Prioriza lectura, ritmo y secuencia visual."]},
  {id:"hospitality-ux",kind:"skill",name:"Hospitality UX",description:"Optimiza experiencias para hoteles, turismo, gastronomía y servicios presenciales.",builtin:true,instructions:["Prioriza confianza, contexto del servicio y próximos pasos.","Haz visibles disponibilidad, ubicación, inclusiones y condiciones cuando existan.","Reduce ansiedad antes de reservar o solicitar."]},
  {id:"dashboard-ops",kind:"skill",name:"Dashboard operativo",description:"Convierte datos y acciones en un panel de control útil.",builtin:true,instructions:["La primera vista debe responder qué requiere atención ahora.","Separa estado, acciones, alertas y métricas.","Evita widgets decorativos sin decisión asociada.","Las acciones frecuentes deben estar a uno o dos clics."]},
  {id:"accessibility",kind:"skill",name:"Accesibilidad",description:"Refuerza legibilidad y navegación inclusiva.",builtin:true,instructions:["Usa HTML semántico y labels reales.","Contraste suficiente y estados de foco visibles.","Respeta prefers-reduced-motion.","No dependas solo del color para comunicar estado."]},
  {id:"performance",kind:"skill",name:"Performance",description:"Reduce peso y complejidad innecesaria.",builtin:true,instructions:["Minimiza JavaScript y DOM innecesario.","Evita animaciones costosas y assets sin propósito.","Carga de forma diferida contenido secundario cuando corresponda."]},
  {id:"seo",kind:"skill",name:"SEO técnico",description:"Estructura páginas públicas para indexación y comprensión.",builtin:true,instructions:["Usa title, description y jerarquía de encabezados coherente.","Incluye semántica útil y contenido textual rastreable.","Evita duplicación de H1 y navegación ambigua."]},
  {id:"motion",kind:"skill",name:"Motion suave",description:"Agrega movimiento discreto con propósito.",builtin:true,instructions:["Anima solo cambios de estado, jerarquía o entrada de contenido.","Duraciones cortas y easing natural.","Respeta prefers-reduced-motion.","Evita movimiento continuo sin función."]},
  {id:"ecommerce",kind:"skill",name:"E-commerce",description:"Mejora exploración, decisión y compra.",builtin:true,instructions:["Haz precio, variante, disponibilidad y CTA legibles cuando existan.","Reduce pasos antes de la acción principal.","Facilita comparación sin saturar la interfaz."]},
  {id:"forms",kind:"skill",name:"Formularios claros",description:"Diseña formularios con baja fricción y buen feedback.",builtin:true,instructions:["Pide solo información necesaria.","Agrupa campos por intención.","Incluye validación y mensajes accionables.","Mantén estados loading/success/error."]},
  {id:"saas-product",kind:"skill",name:"SaaS Product UX",description:"Construye interfaces de producto con navegación y estados consistentes.",builtin:true,instructions:["Prioriza tareas y objetos del usuario sobre marketing.","Usa patrones consistentes para acciones, filtros y estados vacíos.","Explica claramente configuraciones y consecuencias."]}
];

export const BUILTIN_STYLES:FactoryCapability[]=[
  {id:"link-minimal",kind:"style",name:"LINK Minimal",description:"Monocromo, preciso, editorial y tecnológico.",builtin:true,instructions:["Paleta neutra con negro, blanco y grises cálidos.","Geometría simple, bordes finos y radios controlados.","Tipografía sans serif con jerarquía fuerte.","Movimiento suave, sin ornamento innecesario."]},
  {id:"apple-soft",kind:"style",name:"Apple Soft",description:"Superficies limpias, aire y profundidad mínima.",builtin:true,instructions:["Mucho whitespace y lectura inmediata.","Radios suaves y sombras extremadamente sutiles.","Controles simples con feedback claro.","Evita copiar componentes o textos de Apple literalmente."]},
  {id:"editorial",kind:"style",name:"Editorial",description:"Composición tipográfica, grilla y ritmo de revista.",builtin:true,instructions:["Titulares grandes y contraste de escalas.","Columnas, números y microcopy como elementos de composición.","Usa imágenes como narrativa, no decoración."]},
  {id:"luxury-hospitality",kind:"style",name:"Luxury Hospitality",description:"Calma, sofisticación y experiencia premium.",builtin:true,instructions:["Ritmo lento, espacio generoso y contenido selectivo.","Evita dorados o clichés de lujo por defecto.","Fotografía/imagen debe tener protagonismo si existe."]},
  {id:"dark-tech",kind:"style",name:"Dark Tech",description:"Oscuro, técnico y controlado.",builtin:true,instructions:["Fondos oscuros con contraste alto y pocos acentos.","Superficies compactas y datos bien alineados.","Evita neón excesivo y efectos sci-fi gratuitos."]},
  {id:"brutalist",kind:"style",name:"Brutalist",description:"Directo, tipográfico y estructural.",builtin:true,instructions:["Bordes visibles, contraste fuerte y composición franca.","Poca ornamentación y jerarquía explícita.","Mantén usabilidad aunque la estética sea cruda."]},
  {id:"warm-organic",kind:"style",name:"Warm Organic",description:"Natural, cálido y humano sin perder claridad digital.",builtin:true,instructions:["Fondos cálidos, texturas solo si aportan.","Ritmo relajado y formas suaves.","Evita estética artesanal genérica."]}
];

export function capabilityById(id:string,custom:FactoryCapability[]=[]){
  return [...BUILTIN_SKILLS,...BUILTIN_STYLES,...custom].find(x=>x.id===id)||null;
}
