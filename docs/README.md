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
  funciones.js
  main.js
  web-app.js
MedAlert.fig
index.html
```

Los recursos exportados desde Figma se mantienen juntos en `design/` para conservar sus rutas. Los estilos y el código propio de la web están separados en `css/` y `js/`. Las rutas son relativas para que el sitio funcione al publicarse en la raíz o en una subruta de GitHub Pages.

## Nota

La interfaz usa registros de ejemplo para la demostración académica. No consulta servicios oficiales ni envía reportes.
