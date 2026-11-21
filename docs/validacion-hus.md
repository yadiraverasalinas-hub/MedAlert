# Validación de historias de usuario Must

**Fecha:** 21 de noviembre de 2026  
**Alcance:** las 30 HUs Must enumeradas en [`README_HUS.md`](../README_HUS.md).  
**Evaluación:** la aplicación web que se abre desde el `index.html` de la raíz, no solo las pantallas dibujadas en Figma.

## Resultado

| Estado | Cantidad | Significado |
|---|---:|---|
| Funcional en demo local | 14 | La interacción principal está implementada, con límites y datos locales claramente indicados; no implica validación en producción. |
| Parcial | 9 | Hay una interacción local, pero no completa la historia o depende de captura/servicios aún ausentes. |
| No implementada en la web publicada | 7 | La función requiere OCR, IA, fuentes oficiales o comparación de nombres que no están disponibles. |

Por lo tanto, **la web todavía no cumple todas las HUs Must**. Se implementaron recorridos locales para farmacia y consumidores, pero OCR, IA, consulta de fuentes oficiales, alertas sanitarias oficiales y backend siguen pendientes; no se simulan como servicios reales.

## Revisión por historia

| HU | Estado | Evidencia y brecha |
|---|---|---|
| HU-001 | Funcional en demo local | El modo consumidor permite seleccionar una foto del frente y otra del reverso, ver ambas y confirmar que son legibles. Las fotos solo permanecen en memoria mientras la pestaña está abierta. |
| HU-002 | Parcial | Hay instrucciones antes de la captura, pero no hay guía superpuesta en cámara ni validación automática de encuadre/legibilidad. |
| HU-004 | No cumple | Los datos son ejemplos escritos en el código; no hay motor OCR que extraiga nombre, fabricante, concentración, lote, vencimiento y registro. |
| HU-005 | Parcial | Se pueden editar manualmente los datos destacados, pero no hay resultado OCR que corregir ni autocompletado detectado. |
| HU-007 | No cumple | No se analiza el empaque con IA ni con un servicio equivalente. |
| HU-008 | No cumple | No se consulta el registro sanitario ni el fabricante en fuentes oficiales. |
| HU-009 | No cumple | Los estados y alertas visibles son datos de demostración; no se consultan alertas sanitarias por producto. |
| HU-010 | No cumple | No se presenta un nivel de riesgo sanitario validado; el modo consumidor deja claro que la autenticidad/seguridad no está confirmada. |
| HU-011 | Parcial | Si se ingresa una fecha vencida o una señal del empaque, se recomienda consultar a un profesional; no hay recomendación basada en un resultado oficial. |
| HU-012 | Parcial | El resumen muestra cada dato y aclara que fue ingresado manualmente y no está validado; no existe detalle de una consulta externa por campo. |
| HU-017 | Funcional en demo local | El modo consumidor guía en pasos de captura, datos, empaque y resultado. |
| HU-018 | Funcional en demo local | Los controles A−/A+ amplían texto y controles durante el flujo actual. |
| HU-020 | Funcional en demo local | Se capturan por separado ambas caras y se requiere confirmación visual antes de avanzar. |
| HU-021 | Parcial | Los campos importantes se resaltan para revisión manual; no son campos detectados por OCR. |
| HU-022 | Parcial | Se compara literalmente el texto ingresado del medicamento con la indicación ingresada; no se evalúa pertinencia clínica. |
| HU-023 | No cumple | No hay comparación de nombres/presentaciones ni detección de similitud. |
| HU-024 | Funcional en demo local | El usuario ingresa vencimiento y la web indica si la fecha parece vencida según el calendario local. |
| HU-025 | Funcional en demo local | Se muestra un resumen con explicación simple y opciones prudentes; no certifica el producto. |
| HU-026 | Funcional en demo local | Se requieren dos confirmaciones explícitas (identidad/concentración y presentación) antes de confirmar la revisión. |
| HU-027 | Funcional en demo local | Se puede detener el flujo, volver al resumen o borrar las fotos de la sesión y ver opciones de consulta; no hay contacto integrado. |
| HU-033 | Parcial | El modo rápido permite ingresar varios bultos de una misma guía y conserva proveedor/guía al continuar. La captura de imagen y el OCR no están implementados. |
| HU-035 | Funcional en demo local | El checklist es por bulto, guarda el avance y bloquea el contraste hasta completar las seis comprobaciones. |
| HU-036 | Parcial | El formulario presenta y guarda los datos del empaque en una vista, pero deben ingresarse manualmente; no hay extracción OCR. |
| HU-037 | Funcional en demo local | Compara los campos ingresados del empaque con los de la guía, expone coincidencias/diferencias y no agrega al inventario si faltan datos o hay diferencias. |
| HU-038 | Funcional en demo local | Permite registrar señales del empaque y una observación; se guardan por bulto y afectan la clasificación local. |
| HU-039 | No cumple | No hay contraste automático con fuentes oficiales. |
| HU-040 | Parcial | Permite registrar alertas internas asociadas a producto y lote, pero no consulta alertas sanitarias oficiales. |
| HU-041 | Funcional en demo local | Muestra un nivel de riesgo y los factores usados por reglas locales simples; no es una clasificación sanitaria validada. |
| HU-042 | Funcional en demo local | Permite marcar un bulto como observado con motivo; queda fuera del inventario y se conserva al recargar. |
| HU-043 | Funcional en demo local | Registra la acción, detalle y fecha, y permite ver/imprimir una constancia local. |

## Hallazgos transversales

- `index.html` fija la aplicación en edición `web`; incluye un modo consumidor nativo con pasos accesibles, no las pantallas móviles exportadas de Figma.
- `js/main.js` carga las pantallas desde archivos `design/<id>.js`. En el proyecto hay módulos para las 17 pantallas web, pero no para las 38 pantallas `celular` que aparecen en los metadatos de diseño. Por tanto, esas pantallas no son una implementación ejecutable.
- La web inicia con seis registros de ejemplo. Los nuevos registros, checklist, comparaciones, inspecciones, alertas y acciones se guardan en `localStorage` de este navegador; no se comparten ni sincronizan con otros dispositivos.
- La interfaz de farmacia ofrece “Restablecer datos locales” y advierte que no se ingresen datos personales. `Verificado local` significa únicamente comparación manual contra la guía, no validación oficial.
- El modo consumidor no guarda los datos médicos ni las fotos: estos se mantienen en memoria y se pierden al cerrar/recargar la pestaña.
- La búsqueda del código no encontró integración con OCR, IA, `fetch`/API de fuentes oficiales ni servicio de alertas.
- Se probó manualmente en navegador: checklist (bloqueo hasta completar 6), recepción de un nuevo bulto, comparación con diferencia, inspección, riesgo/alerta local, observación, acción y constancia persistida; además, captura de ambas caras, revisión manual, confirmaciones, detener y volver al modo farmacia. No hubo errores JavaScript en estos recorridos. No hay pruebas automatizadas de aceptación para las 30 HUs.

## Próximos pasos recomendados

1. Acordar criterios de aceptación y separar qué HUs deben estar en la entrega web frente a cuáles pertenecen a la aplicación móvil.
2. Completar la guía de cámara y captura de evidencia para el modo rápido de farmacia.
3. Implementar o integrar OCR, análisis de empaque y fuentes oficiales antes de presentar HU-004, HU-007–010 y HU-039 como funciones reales.
4. Añadir un catálogo confiable y criterios de aceptación para comparación de nombres, explicación de riesgo y pertinencia de indicación.
5. Añadir pruebas de aceptación por HU, incluyendo estados persistidos y errores de servicios externos.
