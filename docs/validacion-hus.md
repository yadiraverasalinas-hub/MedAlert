# Validación de historias de usuario Must

**Fecha:** 21 de noviembre de 2026  
**Alcance:** las 30 HUs Must enumeradas en [`README_HUS.md`](../README_HUS.md).  
**Evaluación:** la aplicación web que se abre desde el `index.html` de la raíz, no solo las pantallas dibujadas en Figma.

## Resultado

| Estado | Cantidad | Significado |
|---|---:|---|
| Funcional en demo local | 18 | La interacción principal está implementada, con límites y datos locales claramente indicados; no implica validación en producción. |
| Parcial | 6 | Hay una interacción local, pero no completa la historia o depende de captura/servicios aún ausentes. |
| No implementada en la web publicada | 6 | La función requiere IA, fuentes oficiales o comparación de nombres que no están disponibles. |

Por lo tanto, **la web todavía no cumple todas las HUs Must**. El OCR ya propone datos localmente para revisión, pero el análisis de empaque con IA, las consultas oficiales, las alertas sanitarias y el backend siguen pendientes; no se simulan como servicios reales.

## Revisión por historia

| HU | Estado | Evidencia y brecha |
|---|---|---|
| HU-001 | Funcional en demo local | El modo consumidor permite seleccionar una foto del frente y otra del reverso, ver ambas y confirmar que son legibles. Las fotos solo permanecen en memoria mientras la pestaña está abierta. |
| HU-002 | Parcial | Hay instrucciones antes de la captura, pero no hay guía superpuesta en cámara ni validación automática de encuadre/legibilidad. |
| HU-004 | Parcial | Tesseract.js reconoce texto en español e inglés y propone nombre/concentración, presentación, fabricante, lote, vencimiento y registro a partir de las fotos. La extracción por patrones puede omitir o leer mal formatos del empaque; cada campo y la transcripción requieren revisión. |
| HU-005 | Funcional en demo local | Las sugerencias OCR aparecen en campos editables; al volver a leer, se conservan los cambios manuales. También se puede completar todo manualmente. |
| HU-007 | No cumple | No se analiza el empaque con IA ni con un servicio equivalente. |
| HU-008 | No cumple | No se consulta el registro sanitario ni el fabricante en fuentes oficiales. |
| HU-009 | No cumple | Los estados y alertas visibles son datos de demostración; no se consultan alertas sanitarias por producto. |
| HU-010 | No cumple | No se presenta un nivel de riesgo sanitario validado; el modo consumidor deja claro que la autenticidad/seguridad no está confirmada. |
| HU-011 | Parcial | Si se ingresa una fecha vencida o una señal del empaque, se recomienda consultar a un profesional; no hay recomendación basada en un resultado oficial. |
| HU-012 | Parcial | El resumen muestra cada dato y aclara que fue ingresado manualmente y no está validado; no existe detalle de una consulta externa por campo. |
| HU-017 | Funcional en demo local | El modo consumidor guía en pasos de captura, datos, empaque y resultado. |
| HU-018 | Funcional en demo local | Los controles A−/A+ amplían texto y controles durante el flujo actual. |
| HU-020 | Funcional en demo local | Se capturan por separado ambas caras y se requiere confirmación visual antes de avanzar. |
| HU-021 | Funcional en demo local | Se resaltan los campos importantes y se muestran las sugerencias OCR y el texto reconocido para que adultos mayores o cuidadores puedan comprobarlos visualmente. |
| HU-022 | Parcial | Se compara literalmente el texto ingresado del medicamento con la indicación ingresada; no se evalúa pertinencia clínica. |
| HU-023 | No cumple | No hay comparación de nombres/presentaciones ni detección de similitud. |
| HU-024 | Funcional en demo local | El usuario ingresa vencimiento y la web indica si la fecha parece vencida según el calendario local. |
| HU-025 | Funcional en demo local | Se muestra un resumen con explicación simple y opciones prudentes; no certifica el producto. |
| HU-026 | Funcional en demo local | Se requieren dos confirmaciones explícitas (identidad/concentración y presentación) antes de confirmar la revisión. |
| HU-027 | Funcional en demo local | Se puede detener el flujo, volver al resumen o borrar las fotos de la sesión y ver opciones de consulta; no hay contacto integrado. |
| HU-033 | Funcional en demo local | “Nueva recepción” aparece una sola vez por pantalla. El modo rápido permite ingresar varios bultos por guía y ofrece lectura OCR opcional desde fotos en el mismo formulario; las capturas siguen siendo locales y requieren revisión manual. |
| HU-035 | Funcional en demo local | El checklist es por bulto, guarda el avance y bloquea el contraste hasta completar las seis comprobaciones. |
| HU-036 | Funcional en demo local | El formulario de una sola vista propone lote, vencimiento, registro, fabricante, producto y presentación usando OCR de las fotos seleccionadas. La persona debe validar y corregir los valores antes de guardar; no se contrasta con fuentes oficiales. |
| HU-037 | Funcional en demo local | Compara los campos ingresados del empaque con los de la guía, expone coincidencias/diferencias y no agrega al inventario si faltan datos o hay diferencias. En una inconsistencia ofrece una acción directa para enviarla a cuarentena, con confirmación y conservación del motivo. |
| HU-038 | Funcional en demo local | Permite registrar señales del empaque y una observación; se guardan por bulto y afectan la clasificación local. |
| HU-039 | No cumple | No hay contraste automático con fuentes oficiales. |
| HU-040 | Parcial | Permite registrar alertas internas asociadas a producto y lote, pero no consulta alertas sanitarias oficiales. |
| HU-041 | Funcional en demo local | Muestra un nivel de riesgo y los factores usados por reglas locales simples; no es una clasificación sanitaria validada. |
| HU-042 | Funcional en demo local | Permite marcar un bulto como observado con motivo o enviar directamente una inconsistencia a cuarentena. La acción requiere confirmación, conserva el motivo, excluye el bulto del inventario y actualiza la lista y contador local. |
| HU-043 | Funcional en demo local | Registra acciones con fecha, tipo, bulto y motivo en la pantalla Historial; el registro persiste en este navegador, puede exportarse como CSV y complementa la constancia local. No es una auditoría de servidor ni un registro inmutable. |

## Hallazgos transversales

- `index.html` fija la aplicación en edición `web`; incluye un modo consumidor nativo con pasos accesibles, no las pantallas móviles exportadas de Figma.
- `js/main.js` carga las pantallas desde archivos `design/<id>.js`. En el proyecto hay módulos para las 17 pantallas web, pero no para las 38 pantallas `celular` que aparecen en los metadatos de diseño. Por tanto, esas pantallas no son una implementación ejecutable.
- La web inicia con seis registros de ejemplo. Los nuevos registros, checklist, comparaciones, inspecciones, alertas y acciones se guardan en `localStorage` de este navegador; no se comparten ni sincronizan con otros dispositivos.
- Historial conserva localmente eventos de recepción, checklist completo, contraste, inspección, alertas internas, observación y cuarentena. “Restablecer datos locales” también borra ese historial; no sirve como evidencia inmutable o compartida.
- La interfaz de farmacia ofrece “Restablecer datos locales” y advierte que no se ingresen datos personales. `Verificado local` significa únicamente comparación manual contra la guía, no validación oficial.
- El modo consumidor no guarda los datos médicos ni las fotos: estos se mantienen en memoria y se pierden al cerrar/recargar la pestaña.
- `js/ocr.js` carga Tesseract.js 7 desde jsDelivr al solicitar la primera lectura. Las fotos y transcripciones no se envían a una API ni se guardan en `localStorage`; la librería y sus modelos de idioma sí se descargan desde CDN. No hay integración de IA, fuentes oficiales, alertas sanitarias ni backend.
- Se probó manualmente en navegador: checklist (bloqueo hasta completar 6), recepción de un nuevo bulto, comparación con diferencia, inspección, riesgo/alerta local, observación, acción y constancia persistida; además, captura de ambas caras, revisión manual, confirmaciones, detener y volver al modo farmacia. Se verificó OCR con imágenes sintéticas legibles tanto en el formulario de farmacia como en el modo consumidor: se propusieron campos, se mostró la transcripción, se corrigió una fecha y los cambios manuales sobrevivieron a una segunda lectura. La confianza global de Tesseract no garantiza que cada campo sea correcto; esta prueba no representa etiquetas reales ni mide precisión. En la actualización previa también se verificó un solo botón “Nueva recepción”, que cancelar la confirmación no cambia la inconsistencia, que confirmar la envía a cuarentena y que Historial conserva fecha, acción, bulto y motivo después de recargar. Las fotos de prueba permanecieron en memoria y no se guardó ningún bulto. No hay pruebas automatizadas de aceptación para las 30 HUs.

## Próximos pasos recomendados

1. Acordar criterios de aceptación y separar qué HUs deben estar en la entrega web frente a cuáles pertenecen a la aplicación móvil.
2. Completar la guía de cámara y captura de evidencia para el modo rápido de farmacia.
3. Probar y mejorar la extracción OCR con empaques representativos antes de considerar HU-004 completamente cubierta.
4. Implementar análisis de empaque y fuentes oficiales antes de presentar HU-007–010 y HU-039 como funciones reales.
5. Añadir un catálogo confiable y criterios de aceptación para comparación de nombres, explicación de riesgo y pertinencia de indicación.
6. Añadir pruebas de aceptación por HU, incluyendo estados persistidos y errores de servicios externos.
