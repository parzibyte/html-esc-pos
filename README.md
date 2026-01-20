# HTML a ESC POS

https://parzibyte.me/apps/html-esc-pos/

![HTML to thermal printer ESC POS](https://raw.githubusercontent.com/parzibyte/html-esc-pos/master/assets/demo.jpg)

https://parzibyte.me/apps/html-esc-pos/

## Versiones de Node

```bash
C:\Windows\system32>node -v
v20.15.1
```
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
rsync -rnvzi --delete dist/ parzibyte@servidor:/var/www/misitio/apps/html-esc-pos

```

Distribuye el contenido de **dist**