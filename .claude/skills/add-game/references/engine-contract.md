# Contrato del motor

Fuente: `lib/games/types.ts`. Modelo completo: `lib/games/asteroids/engine.ts` (`createAsteroids`).

```ts
export interface GameStats { score: number; lives: number; level: number }
export interface GameCallbacks {
  onStats: (stats: GameStats) => void;       // al cambiar score, vidas o nivel
  onGameOver: (finalScore: number) => void;  // una sola vez
}
export interface GameHandle {
  pause(): void; resume(): void; restart(): void; end(): void; destroy(): void;
}
export type GameFactory = (canvas: HTMLCanvasElement, callbacks: GameCallbacks) => GameHandle;
```

Archivo: `lib/games/<slug>/engine.ts`, exporta `create<Nombre>: GameFactory`.

## Reglas

- Sin React. Único DOM permitido: el `canvas` recibido y `window` (teclado). Prohibido `document.`, `getElementById`, `<audio>` por id.
- Estado dentro del closure de `create<Nombre>`. Sin globals de módulo mutables (constantes `export const` sí).
- Clases/utilidades puras reciben `ctx` por parámetro. Tipado estricto, sin `any`.
- Quitar del dibujo lo que ahora hace React: HUD de score/nivel/vidas, overlay PAUSA, overlay GAME OVER, botones. Se conservan indicadores propios del juego (p. ej. `3x`).
- Juego sin vidas o sin niveles: emitir `lives: 1` / `level: 1` coherentes (o vidas reales si el diseño las tiene). El HUD siempre las muestra.
- `onStats` solo cuando cambia score, vidas o nivel (nunca por frame). Emitir estado inicial al crear/reiniciar.
- `onGameOver` exactamente una vez por partida (también en `end()`), con score actual. Tras game over el loop se detiene y la escena queda congelada bajo el modal.
- Loop con `requestAnimationFrame`; `dt = min((ts - lastTime)/1000, 0.05)`; `lastTime = null` al iniciar/reanudar para no saltar.
- `pause`: cancela rAF, limpia input. `resume`: reinicia `lastTime`, no actúa si game over. `restart`: score 0, estado inicial, input limpio, loop nuevo. `end`: game over forzado. `destroy`: `destroyed = true`, cancela rAF, limpia input, quita listeners. Todas ignoran llamadas tras `destroy`.
- Listeners `keydown`/`keyup` en `window`; `preventDefault` en teclas de juego **solo** si el motor está activo y no pausado (evita scroll y que Espacio pulse botones).
- Limpiar `keys` y `justPressed` en `restart`, `pause`, `destroy`.
- Compatible con React Strict Mode (monta/desmonta 2×): un solo loop y un solo juego de listeners.
- Canvas lógico propio (`W`,`H` exportados), escalado por CSS con `width:100%; height:auto; aspect-ratio: W / H`.
- Previews secundarios (p. ej. `next-canvas` de Tetris) → dibujar dentro del canvas principal o descartar; no segundo canvas DOM.
- Sonido: opcional y fuera de alcance salvo que la spec lo incluya; si entra, `new Audio(url)` dentro del closure, liberar en `destroy`.

## Puntuación

El motor solo reporta score entero ≥ 0 (límite BD 100 000 000). El guardado lo hace `GamePlayer` → `POST /api/scores`. El motor nunca llama a la red.
