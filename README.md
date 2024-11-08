# HTML a ESC POS

## Modo desarrollo

`npm run dev`

Para Tailwind:

`npx tailwindcss -i ./public/css/estilos_entrada.css -o ./public/css/estilos.css --watch`

## Modo producción


1. `npx tailwindcss -i ./public/css/estilos_entrada.css -o ./public/css/estilos.css --minify`

2. `npm run build`

3. `workbox generateSW workbox-config.cjs`

4. Distribuye el contenido de **dist**

Todo junto:

```bash
npx tailwindcss -i ./public/css/estilos_entrada.css -o ./public/css/estilos.css --minify
npm run build
workbox generateSW workbox-config.cjs

```