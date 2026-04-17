# Alebri

Prototipo base para un videojuego de plataformas estilo metroidvania oscuro, pensado para navegador con HTML5 y render por WebGL usando Phaser 3.

## Lo que ya incluye

- Movimiento lateral con salto
- Ataque cuerpo a cuerpo
- Esquiva con invulnerabilidad breve
- Enemigo simple con persecucion
- HUD de vida y aguante
- Camara con seguimiento
- Ambientacion oscura con lluvia, niebla y ruinas

## Como abrirlo

1. Abre `index.html` en un navegador moderno.
2. Si tu navegador aplica restricciones locales o falla la carga del CDN, levanta un servidor estatico simple.

Ejemplo con Python:

```bash
python -m http.server 8080
```

Luego entra a `http://localhost:8080`

## Siguiente evolucion recomendada

1. Sistema de animaciones con spritesheet real
2. Mapa con zonas conectadas y backtracking
3. Guardado de progreso y puntos de descanso
4. Armas secundarias, magia o reliquias
5. Jefe con patrones y fases
6. Tileset pixel art y colisiones por mapa

## Despliegue web

Puedes subir estos archivos a cualquier hosting estatico:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

No hace falta que el jugador instale nada. El juego corre directamente en la web.
