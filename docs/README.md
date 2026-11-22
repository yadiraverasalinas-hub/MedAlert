# MedAlert · Web de farmacia

## Abrir el proyecto

Abre `index.html` en la raíz del proyecto. Es también el punto de entrada para GitHub Pages.

## Estructura

```text
assets/
  fonts/
  icons/
  images/
  videos/
css/
  styles.css
design/
  recursos exportados desde MedAlert.fig
docs/
  README.md
js/
  consumer-app.js
  catalog.js
  funciones.js
  main.js
  ocr.js
  web-app.js
MedAlert.fig
index.html
```

Los recursos exportados desde Figma se mantienen juntos en `design/` para conservar sus rutas. Los estilos y el código propio de la web están separados en `css/` y `js/`. Las rutas son relativas para que el sitio funcione al publicarse en la raíz o en una subruta de GitHub Pages.

## Nota

La aplicación es una demostración local: el modo consumidor guía una revisión manual y el modo farmacia guarda flujos e historial de acciones en este navegador. El historial puede exportarse, pero no es inmutable ni compartido; al restablecer los datos locales también se borra.

El OCR usa Tesseract.js 7 en el navegador (español e inglés) y se carga desde jsDelivr solo cuando se solicita la lectura. La primera ejecución necesita conexión para descargar la librería y sus modelos de idioma. Las fotos y el texto reconocido se procesan en memoria, no se suben ni se guardan en `localStorage`; los datos sugeridos deben revisarse y corregirse manualmente. El OCR no confirma autenticidad, seguridad ni coincidencia con fuentes oficiales.

`js/catalog.js` contiene 30 registros de demostración proporcionados para comparar nombre, principio activo, concentración, presentación, fabricante y registro demo. Si solo coincide la presentación, la interfaz lo etiqueta expresamente y advierte que el nombre puede ser distinto. Las marcas y registros de esa base son ficticios (`REGISTRO_FICTICIO`, `CATALOGO_DEMO`); la similitud es una pista textual local, no una consulta sanitaria ni una probabilidad de identidad. La aplicación tampoco conecta IA, consultas oficiales, alertas sanitarias ni reportes. Usa datos ficticios y no ingreses información personal o sensible.

Consulta [`validacion-hus.md`](./validacion-hus.md) para el estado revisado de las HUs Must.

## Guía visual

La interfaz web sigue una paleta 60–30–10: superficies `#F7FAFC`, estructura azul `#0B3558` / `#0F4C81` y acciones principales verde `#1F8A70`. Usa Inter y una escala de títulos, subtítulos, cuerpo, campos y ayudas de 32, 24, 18, 16, 14 y 12 px. Los iconos son SVG de trazo con retícula `24 × 24`; los estados de color incluyen icono, etiqueta y explicación textual. Las acciones sensibles, como poner un bulto en cuarentena, piden confirmación antes de guardar el cambio local.
