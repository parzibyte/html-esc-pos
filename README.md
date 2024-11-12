# HTML a ESC POS

## Modo desarrollo

`npm run dev`

Para Tailwind:

```bash

npx tailwindcss -i ./estilos_entrada.css -o ./public/css/estilos.css --watch

```

## Modo producción

Todo junto:

```bash
npx tailwindcss -i ./estilos_entrada.css -o ./public/css/estilos.css --minify
npm run build
workbox generateSW workbox-config.cjs


```

Distribuye el contenido de **dist**