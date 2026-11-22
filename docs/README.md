# MedAlert · Web de farmacia

## Abrir el proyecto

Abre `index.html` en la raíz del proyecto para la demostración estática. Es también el punto de entrada para GitHub Pages; la función Gemini solo está disponible al servir la web con el backend Node local descrito abajo.

## API Gemini (desarrollo local)

La integración opcional analiza la transcripción OCR y las comparaciones de hasta tres candidatos del catálogo local para explicar coincidencias, diferencias e inconsistencias. Solo se envían esos textos cuando la persona pulsa **Enviar transcripción a Gemini**; las fotos y los campos escritos manualmente no se envían. La respuesta no autentica medicamentos ni consulta registros oficiales.

1. Revoca la clave que haya aparecido en una captura y crea una nueva en Google AI Studio. No la pegues en el código ni en el chat.
2. Con Node.js 20.6 o posterior, crea el archivo local ignorado por Git: `Copy-Item .env.example .env`.
3. Agrega la clave nueva a `GEMINI_API_KEY` dentro de `.env`.
4. Ejecuta `node --env-file=.env server.js` y abre `http://127.0.0.1:4173`.

El servidor lee la clave solo desde el entorno, escucha en `127.0.0.1` por defecto y no guarda la transcripción. `.gitignore` excluye `.env`; `.env.example` solo contiene un marcador. GitHub Pages no ejecuta Node ni oculta secretos: para usar la función publicada se debe desplegar un backend independiente y protegerlo antes de conectar el sitio.

Las pruebas locales del backend se ejecutan con `node --test`. No requieren una clave real ni hacen llamadas a Gemini.

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
  gemini-client.js
  main.js
  ocr.js
  web-app.js
test/
  server.test.js
.env.example
.gitignore
server.js
MedAlert.fig
index.html
```

Los recursos exportados desde Figma se mantienen juntos en `design/` para conservar sus rutas. Los estilos y el código propio de la web están separados en `css/` y `js/`. Las rutas son relativas para que el sitio funcione al publicarse en la raíz o en una subruta de GitHub Pages.

## Nota

La aplicación es una demostración local: el modo consumidor guía una revisión manual y el modo farmacia guarda flujos e historial de acciones en este navegador. El historial puede exportarse, pero no es inmutable ni compartido; al restablecer los datos locales también se borra.

El OCR usa Tesseract.js 7 en el navegador (español e inglés) y se carga desde jsDelivr solo cuando se solicita la lectura. La primera ejecución necesita conexión para descargar la librería y sus modelos de idioma. Las fotos se procesan en memoria y no se suben ni se guardan en `localStorage`; los datos sugeridos deben revisarse y corregirse manualmente. La transcripción y las comparaciones textuales del catálogo solo se envían a Gemini al pulsar el botón del análisis opcional, cuando se usa el backend local configurado.

`js/catalog.js` contiene 30 registros de demostración proporcionados para comparar nombre, principio activo, concentración, presentación, fabricante y registro demo. Si solo coincide la presentación, la interfaz lo etiqueta expresamente y advierte que el nombre puede ser distinto. Las marcas y registros de esa base son ficticios (`REGISTRO_FICTICIO`, `CATALOGO_DEMO`); la similitud es una pista textual local, no una consulta sanitaria ni una probabilidad de identidad. No hay consultas oficiales ni alertas sanitarias conectadas. Usa datos ficticios y no ingreses información personal o sensible.

Consulta [`validacion-hus.md`](./validacion-hus.md) para el estado revisado de las HUs Must.

## Guía visual

La interfaz web sigue una paleta 60–30–10: superficies `#F7FAFC`, estructura azul `#0B3558` / `#0F4C81` y acciones principales verde `#1F8A70`. Usa Inter y una escala de títulos, subtítulos, cuerpo, campos y ayudas de 32, 24, 18, 16, 14 y 12 px. Los iconos son SVG de trazo con retícula `24 × 24`; los estados de color incluyen icono, etiqueta y explicación textual. Las acciones sensibles, como poner un bulto en cuarentena, piden confirmación antes de guardar el cambio local.
