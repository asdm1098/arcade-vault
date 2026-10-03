# SPEC 07 — Juego Caída (Tetris) jugable en el player

> **Status:** Implementado
> **Depends on:** SPEC 05, SPEC 06
> **Date:** 2026-10-03
> **Objective:** Portar `references/started-games/03-tetris` a un motor TypeScript con canvas y conectarlo a `/juegos/caida/jugar` con su leaderboard.

---

## Por qué existe esta spec

El original es un script global (`document.getElementById`, listeners en `document`, `requestAnimationFrame` sin cancelar, HUD y overlays en el DOM, dos canvas) que se rompe al navegar y remontar en React. Se porta al patrón fijado por SPEC 05 (motor + canvas + registry) y SPEC 06 (`games`/`scores`, `POST /api/scores`). Es el segundo juego real tras Asteroides.

## Alcance

**Dentro:**

- Motor `lib/games/caida/engine.ts` → `createCaida(canvas, callbacks)` con mecánica fiel: tablero 10×20, 8 piezas equiprobables (7 clásicas + tuerca "N" gris), rotación horaria con wall kicks `[0,-1,1,-2,2]`, soft drop (+1 por fila), hard drop (+2 por celda), pieza fantasma (alpha 0.2), puntos de línea `[0,100,300,500,800] × nivel`, nivel = `floor(líneas/10)+1`, caída `max(100, 1000-(nivel-1)*90)` ms.
- Un solo canvas 450×600: tablero 300×600 + panel lateral de 150 px dibujado en canvas (pieza siguiente y contador de líneas).
- Componente `components/games/caida-canvas.tsx` con la misma `GameCanvasProps` (aspect 3:4).
- Entrada `caida` en `lib/games/registry.ts`.
- Catálogo: reutiliza la fila `caida` (PUZZLE, `cover-tetro`, magenta, sort 2). Sin migración ni cambio de esquema.
- `GameStats`: `score`, `level` real, `lives: 1` fijo.
- HUD, PAUSA, FIN, JUGAR DE NUEVO y guardado desde React vía `POST /api/scores`.
- Game over: la pieza nueva colisiona al aparecer → `onGameOver` una vez, escena congelada.

**Fuera de alcance (specs futuras):**

- Tecla `P` (la pausa es solo el botón PAUSA).
- Controles táctiles y sonido.
- Toggle claro/oscuro y `localStorage` del original.
- HUD, overlays y botón reiniciar del DOM original.
- Ampliar `GameStats` con `lines`; tocar `types.ts` o `rocas`.
- Hold, 7-bag, SRS, DAS/ARR propio (se usa el repeat del navegador, como el original).
- Restilizado neón, anti-trampas, tests automatizados, otros juegos.

## Modelo de datos

Sin cambios de esquema. `games`, `scores`, `types.ts`, `GameStats` y `/api/scores` se reutilizan tal cual.

Constantes conservadas de `game.js` (exportadas en el motor):

- `COLS = 10`, `ROWS = 20`, `BLOCK = 30`
- `BOARD_W = 300`, `BOARD_H = 600`, `PANEL_W = 150`, `W = 450`, `H = 600`
- `COLORS[1..8]` = `#4dd0e1 #ffd54f #ba68c8 #81c784 #e57373 #90caf9 #ffb74d #9e9e9e`
- `PIECES[1..8]` = I, O, T, S, Z, J, L, N (matrices del original)
- `LINE_SCORES = [0,100,300,500,800]`
- Caída inicial 1000 ms, mínimo 100 ms, −90 ms por nivel; 10 líneas por nivel

Tipos locales del motor:

```ts
type Matrix = number[][]; // 0 vacío, 1–8 color
interface Piece {
  type: number;
  shape: Matrix;
  x: number;
  y: number;
}
```

Estado en el closure de `createCaida`: `board`, `current`, `next`, `score`, `lines`, `level`, `dropInterval`, `dropAccum`, `lastTime`, `paused`, `gameOver`, `rafId`. Sin globals mutables.

Mapeo a `GameStats`:

| Campo   | Valor                |
| ------- | -------------------- |
| `score` | score del motor      |
| `level` | `floor(líneas/10)+1` |
| `lives` | `1` fijo             |

`onStats` solo se emite cuando cambia score o nivel. Las líneas no se emiten: solo se dibujan en el panel del canvas.

Canvas y teclas:

- Canvas lógico 450×600 (aspect 3:4). Panel derecho (x ≥ 300): etiqueta `NEXT` + pieza siguiente en caja 4×4 de 30 px, y `LINES` + contador. Fondo negro, tipografía monoespaciada.
- Teclas: `←` `→` mover, `↑`/`X` rotar, `↓` soft drop, `Espacio` hard drop. `preventDefault` solo si el motor está activo y no pausado.
- `dt = min((ts-lastTime)/1000, 0.05)`; el acumulador de caída usa ms. `lastTime = null` al iniciar y reanudar.
- Color de cuadrícula fijo (el original lee la variable CSS `--grid-line`).

## Plan de implementación

Rama `spec-07-caida`. Un commit por paso, con pausa para revisar el diff.

1. **Motor, mecánica.** Crear `lib/games/caida/engine.ts` con constantes, `PIECES`, utilidades puras (`createBoard`, `collide`, `rotateCW`, `clearLines`) y `createCaida` sin render: estado en closure, loop con `dt` capado, input, `onStats`, `onGameOver`, `pause/resume/restart/end/destroy`. Verificar: `pnpm lint`, `pnpm build`.
2. **Motor, dibujo.** En el mismo archivo: `drawBlock`, cuadrícula, tablero, fantasma, pieza actual y panel lateral (NEXT + LINES). Verificar: `pnpm build`; `grep` sin `document.` ni `getElementById`.
3. **Canvas React.** Crear `components/games/caida-canvas.tsx` con el patrón de `asteroids-canvas.tsx` (canvas 450×600, `aspectRatio: 3 / 4`). Si `.crt-screen` fuerza 4:3, ajustarlo solo para este juego. Verificar: `pnpm lint`.
4. **Registry.** Añadir `caida: CaidaCanvas` en `lib/games/registry.ts`. Evaluar extraer un `GameCanvas` genérico (`factory`, `width`, `height`) sin romper `rocas`. Verificar: `pnpm build`.
5. **Verificación en navegador.** `pnpm dev` + Playwright en `/juegos/caida/jugar` (desktop y ≤ 768 px), guardado en `/salon?juego=caida`, `get_advisors`, `count(*) from scores where game_id='caida'` ≥ 10. Capturas en `.playwright-screenshots/`. Verificar: `pnpm lint`, `pnpm build`.
6. **Cierre.** Marcar la spec `Implementado`.

Notas:

- No hay paso de BD ni de `game-player.tsx`: la fila existe y el guardado ya pasa por `/api/scores`. El paso 5 lo confirma. `game-player.tsx` solo se toca si el layout 3:4 lo exige.
- El paso 1 supera las 50 líneas. El original tiene ~300, así que se acepta como excepción para tener un motor jugable en un solo commit.

## Criterios de aceptación

- [ ] `pnpm lint` termina sin errores.
- [ ] `pnpm build` termina sin errores.
- [ ] `/juegos/caida/jugar` muestra un canvas 3:4 con tablero 10×20 vacío, una pieza arriba y panel con NEXT y LINES = 0.
- [ ] `←` `→` mueven la pieza, `↑` y `X` la rotan, `↓` la baja, `Espacio` la deja caer; la página no hace scroll y `Espacio` no pulsa PAUSA/FIN.
- [ ] La pieza no sale del tablero ni se solapa con bloques fijados.
- [ ] La rotación pegada a una pared aplica wall kick (±1/±2) cuando hay hueco.
- [ ] La pieza fantasma se dibuja en la posición de aterrizaje.
- [ ] El panel muestra la pieza siguiente y esta pasa a ser la actual al fijarse la actual.
- [ ] Cada fila bajada por soft drop suma 1 punto; cada celda de hard drop suma 2, reflejado en "Puntuación".
- [ ] Limpiar 1, 2, 3 y 4 líneas suma 100, 300, 500 y 800 × nivel.
- [ ] El contador LINES del canvas aumenta con las líneas limpiadas.
- [ ] Al llegar a 10 líneas el "Nivel" del HUD pasa a 02 y la caída automática es 910 ms.
- [ ] El HUD muestra 1 vida (`♥`) durante toda la partida.
- [ ] Si la pieza nueva colisiona al aparecer, se abre "FIN DEL JUEGO" una sola vez con la puntuación final correcta y el tablero queda congelado.
- [ ] "FIN" abre el modal con el score actual y detiene el juego.
- [ ] "JUGAR DE NUEVO" reinicia con score 0, nivel 01, tablero vacío y líneas 0.
- [ ] "PAUSA" congela caída e input; "REANUDAR" continúa sin salto de movimiento.
- [ ] "GUARDAR PUNTUACIÓN" devuelve 201, inserta fila en `scores` con `game_id='caida'` y aparece en `/salon?juego=caida`.
- [ ] La tabla `games` sigue con 1 fila `caida` y `scores` con ≥ 10 filas para `caida`.
- [ ] Navegar fuera y volver no duplica loop ni listeners (una pulsación = un movimiento).
- [ ] Con Strict Mode en desarrollo corre un solo loop.
- [ ] `lib/games/caida/engine.ts` no contiene `document.`, `getElementById`, `localStorage` ni variables mutables a nivel de módulo.
- [ ] Sin scroll horizontal en ancho ≤ 768 px y sin errores en la consola del navegador.
- [ ] `/juegos/gloton/jugar` conserva la arena mock y `/juegos/rocas/jugar` sigue funcionando.

## Decisiones tomadas y descartadas

- **Sí:** motor TypeScript `createCaida(canvas, callbacks)` con `destroy`. Limpia rAF y listeners, y comunica stats al HUD (patrón de SPEC 05).
- **No:** iframe o `next/script` con `game.js`. No comunica score ni se limpia al remontar.
- **Sí:** reutilizar la fila `caida` del catálogo. No duplica el catálogo y no hay migración.
- **No:** crear un juego `tetris`. Duplicaría el catálogo.
- **Sí:** un solo canvas 450×600 con NEXT y LINES dibujados dentro. El contrato prohíbe un 2º canvas DOM y no hay hueco en el HUD para esos datos.
- **No:** canvas 300×600 sin NEXT. Pierde una mecánica del original.
- **Sí:** conservar la pieza N (tuerca), 8 piezas equiprobables. Es lo que hace `game.js`; el README que dice 7 está desactualizado.
- **No:** quitar la N. Cambiaría la mecánica respecto al código.
- **Sí:** `lives: 1` fijo y `level` real. Sigue el contrato del motor y el HUD siempre muestra ambos.
- **No:** ampliar `GameStats` con `lines`. Tocaría `types.ts`, `GamePlayer` y `rocas` por un dato secundario.
- **Sí:** quitar la tecla `P`; la pausa es el botón PAUSA de React. El contrato no tiene callback de pausa del motor hacia React.
- **No:** añadir callback de pausa. Cambio de contrato que merece su propia spec.
- **Sí:** quitar toggle de tema y `localStorage`. La plataforma tiene su tema y `av_scores` murió en SPEC 06.
- **Sí:** color de cuadrícula fijo en el motor, porque el original lee una variable CSS del `body`.
- **Sí:** repetición de teclas del navegador como en el original. Un DAS/ARR propio es otra mecánica.
- **Sí:** `onGameOver` al instante al fallar el spawn; el modal aparece sobre el tablero congelado, igual que en SPEC 05.
- **Sí:** carpeta del motor `lib/games/caida/` (id del catálogo), aunque la referencia se llame `tetris`.

## Riesgos identificados

| Riesgo                                                                | Mitigación                                                                                      |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Strict Mode monta 2× y duplica loops                                  | `destroy()` cancela rAF y quita listeners; criterio de aceptación lo verifica                   |
| Flechas y `Espacio` hacen scroll o pulsan botones                     | `preventDefault` solo con el motor activo y sin pausa                                           |
| `.crt-screen` pensado para 4:3 deforma un canvas 3:4                  | Paso 3 ajusta el contenedor solo para este juego; verificar con capturas                        |
| `dt` enorme al volver a la pestaña                                    | `dt` capado a 50 ms y `lastTime = null` al reanudar                                             |
| El `dropAccum` del original se reinicia a 0 y pierde el sobrante      | Se conserva igual; es la mecánica original                                                      |
| Teclas heredadas entre partidas                                       | Limpiar input en `restart`, `pause` y `destroy`                                                 |
| Soft drop con la pieza apoyada la fija al instante (como el original) | Se mantiene fiel; documentar en el paso 1                                                       |
| Matrices mutadas por referencia al rotar o generar piezas             | Copiar `PIECES[type]` al crear; `rotateCW` devuelve matriz nueva                                |
| `onStats` por frame provoca re-renders                                | Emitir solo si cambian score o nivel                                                            |
| Next 16.3.7 difiere de lo conocido                                    | El canvas es client puro; verificar firmas en `node_modules/next` si se toca algo del framework |

## Qué **no** está en esta spec

- Tecla `P` y callback de pausa del motor.
- Controles táctiles / versión móvil.
- Sonido y música.
- Toggle de tema y `localStorage`.
- `lines` en `GameStats` / HUD de la plataforma.
- Hold, 7-bag, SRS, DAS/ARR.
- Restilizado neón del dibujo.
- Migraciones o cambios de esquema.
- Motores de los demás juegos (Arkanoid, etc.).
- Anti-trampas y tests automatizados.

Cada punto, si se aborda, va en su propia spec.
