# SPEC 05 — Juego Asteroides jugable en el player

> **Status:** Borrador
> **Depends on:** SPEC 01
> **Date:** 2026-10-03
> **Objective:** Portar el juego `references/started-games/02-asteroids` a un motor TypeScript con canvas y conectarlo al player de `/juegos/rocas/jugar`, reemplazando la arena mock solo para ese juego.

---

## Por qué existe esta spec

Hoy `GamePlayer` simula la partida: la puntuación sube sola con `setInterval` y la arena es decoración CSS. Asteroides es el primer juego real y fija el patrón (motor + registro) que usarán Tetris y Arkanoid. El original es un script global (`document.getElementById`, listeners en `window`, `requestAnimationFrame` sin cancelar) que se rompe al navegar y remontar en React, por eso se porta a un módulo con ciclo de vida (`destroy`).

## Alcance

**Dentro:**

- Motor `lib/games/asteroids/engine.ts` portado de `game.js` con la misma mecánica: nave con inercia, rotación, propulsión y disparo; asteroides de tamaño 3/2/1 que se parten; powerup `3x` (triple disparo); partículas; vidas con invencibilidad al reaparecer; niveles con `3 + level` asteroides.
- Gráficos idénticos al original: vectores blancos sobre negro, canvas lógico 800×600.
- API del motor: `createAsteroids(canvas, callbacks)` devuelve `{ pause, resume, restart, end, destroy }`.
- Componente client `components/games/asteroids-canvas.tsx` que monta el canvas, crea el motor en `useEffect` y lo destruye al desmontar.
- Registro `lib/games/registry.ts` (`id` del juego → componente de juego). Solo `rocas` tiene entrada.
- `GamePlayer` usa el registro: si `rocas` tiene motor, muestra el canvas dentro de la pantalla CRT; si no, mantiene la arena mock y el `setInterval` actuales.
- HUD de React (Jugador / Puntuación / Vidas / Nivel) alimentado por el motor; el canvas ya no dibuja el HUD de score, nivel ni vidas.
- PAUSA, FIN, SALIR y el modal "FIN DEL JUEGO" (guardar en `localStorage` `av_scores`, "Jugar de nuevo") funcionan con el motor real.
- Canvas escalado por CSS conservando 4:3 dentro de `.crt-screen`.

**Fuera de alcance (specs futuras):**

- Controles táctiles / móvil.
- Restilizar el dibujo al tema neón (cyan/magenta/yellow).
- Los otros juegos (Tetris, Arkanoid, etc.) y sus motores.
- Sonido y música.
- Guardar puntuaciones en Supabase (sigue `localStorage`).
- OVNIs (los menciona la descripción de `rocas` en `lib/data.ts`, pero el original no los tiene).
- Cambiar `best`/`plays` del catálogo con datos reales.
- Tests automatizados.

## Modelo de datos

Tipos en `lib/games/types.ts`:

```ts
export interface GameStats {
  score: number;
  lives: number;
  level: number;
}

export interface GameCallbacks {
  onStats: (stats: GameStats) => void; // al cambiar score, vidas o nivel
  onGameOver: (finalScore: number) => void; // una vez, al quedarse sin vidas o al llamar end()
}

export interface GameHandle {
  pause: () => void;
  resume: () => void;
  restart: () => void; // reinicia partida: score 0, 3 vidas, nivel 1
  end: () => void; // fuerza game over con el score actual
  destroy: () => void; // cancela rAF y quita listeners
}

export type GameFactory = (
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks,
) => GameHandle;
```

Constantes del original que se conservan tal cual: `W = 800`, `H = 600`, `RADII = [0,16,30,50]`, `SPEEDS = [0,85,55,32]`, `POINTS = [0,100,50,20]`, `POWERUP_DROP_CHANCE = 0.15`, `POWERUP_DURATION = 5`, `POWERUP_TTL = 12`, `TRIPLE_SPREAD = 0.18`, `dt` máximo 50 ms.

Convenciones:

- El motor no importa React ni toca el DOM salvo el `canvas` recibido y `window` para el teclado.
- Estado del juego (`ship`, `bullets`, `asteroids`…) vive dentro del closure de `createAsteroids`, sin globals de módulo.
- Controles: `←` `→` rotar, `↑` propulsar, `Espacio` disparar. Se llama `preventDefault` en esas teclas solo mientras el motor está activo y no pausado.
- Esta spec no cambia `lib/types.ts`, `SavedScore` ni la clave `av_scores`.

## Plan de implementación

1. Crear `lib/games/types.ts` con `GameStats`, `GameCallbacks`, `GameHandle` y `GameFactory`. Verificar con `pnpm lint`.
2. Crear `lib/games/asteroids/engine.ts`: clases `Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle` tipadas y utilidades (`wrap`, `dist`, `rand`, `randInt`) portadas de `game.js`, recibiendo `ctx` por parámetro en lugar de global. Verificar con `pnpm build`.
3. En el mismo archivo, exportar `createAsteroids(canvas, callbacks)`: estado en closure, `initGame`, `update`, `draw` y loop con `requestAnimationFrame` y `dt` capado; listeners de `keydown`/`keyup` en `window`; `onStats` al cambiar score/vidas/nivel; `onGameOver` una sola vez; `pause`/`resume` (resume reinicia `lastTime` para no saltar `dt`), `restart`, `end` y `destroy`. En `draw` se elimina el HUD de score/nivel/vidas y el overlay "GAME OVER", y se conserva el indicador `3x` de powerup. Verificar con `pnpm build`.
4. Crear `components/games/asteroids-canvas.tsx` (`"use client"`): canvas 800×600 con ref, `useEffect` que crea el motor y devuelve `destroy`, props `paused`, `restartKey`, `endSignal`, `onStats`, `onGameOver`. CSS para escalar con `width: 100%`, `aspect-ratio: 4/3`. Verificar con `pnpm lint`.
5. Crear `lib/games/registry.ts` con `GAME_COMPONENTS: Record<string, ComponentType<...>>` y la entrada `rocas`.
6. Refactorizar `components/game-player.tsx`: si `GAME_COMPONENTS[game.id]` existe, renderizar el componente dentro de `.crt-screen` en lugar de `.game-arena`, conectar `onStats` al HUD y `onGameOver` al modal; si no existe, conservar el flujo mock actual (reducer + `setInterval`). PAUSA/FIN/JUGAR DE NUEVO controlan el motor. Verificar en `pnpm dev` jugando `/juegos/rocas/jugar`.
7. Revisar `/juegos/rocas/jugar` y un juego sin motor (p. ej. `/juegos/caida/jugar`) en desktop y ancho ≤ 768 px, con screenshots en `.playwright-screenshots/`. Verificar `pnpm lint` y `pnpm build`.

## Criterios de aceptación

- [ ] `pnpm lint` termina sin errores.
- [ ] `pnpm build` termina sin errores.
- [ ] `/juegos/rocas/jugar` muestra un canvas con la nave en el centro, 4 asteroides grandes y fondo negro dentro de la pantalla CRT.
- [ ] `←` y `→` rotan la nave, `↑` la propulsa y `Espacio` dispara; la página no hace scroll al pulsarlas.
- [ ] Destruir un asteroide grande suma 20, uno mediano 50 y uno pequeño 100 en "Puntuación" del HUD.
- [ ] Un asteroide grande se parte en 2 medianos, un mediano en 2 pequeños y un pequeño desaparece sin partirse.
- [ ] Chocar con un asteroide fuera de invencibilidad resta una vida en el HUD y la nave reaparece tras 2 s con parpadeo.
- [ ] Al destruir todos los asteroides el "Nivel" del HUD sube a 02 y aparecen 5 asteroides grandes.
- [ ] Al llegar a 0 vidas se abre el modal "FIN DEL JUEGO" con la puntuación final correcta.
- [ ] "GUARDAR PUNTUACIÓN" escribe una entrada `{ game: "rocas", score, name, at }` en `localStorage["av_scores"]`.
- [ ] "FIN" abre el modal con el score actual y detiene el juego.
- [ ] "JUGAR DE NUEVO" reinicia con score 0, 3 vidas, nivel 01 y asteroides nuevos.
- [ ] "PAUSA" congela el juego y muestra el overlay "EN PAUSA"; "REANUDAR" continúa sin salto de movimiento.
- [ ] Navegar a otra ruta y volver no duplica el loop ni los listeners (disparar una vez genera una sola bala).
- [ ] Con `reactStrictMode` activo en desarrollo el juego corre con un solo loop.
- [ ] `/juegos/caida/jugar` conserva la arena mock y el contador automático actual.
- [ ] El canvas mantiene proporción 4:3 y `/juegos/rocas/jugar` no tiene scroll horizontal en ancho ≤ 768 px.
- [ ] No hay errores en la consola del navegador al jugar ni al salir.
- [ ] `lib/games/asteroids/engine.ts` no contiene `document.`, `getElementById` ni variables globales de módulo mutables.

## Decisiones tomadas y descartadas

- **Sí:** motor TypeScript con `createAsteroids(canvas, callbacks)` y `destroy`. Permite limpiar rAF/listeners y comunicar stats al HUD. Decisión del usuario.
- **No:** iframe con `index.html` estático. No hay comunicación limpia de score/vidas ni guardado.
- **No:** `next/script` con `game.js` global. Se rompe al remontar el componente.
- **Sí:** reutilizar la entrada `rocas` de `lib/data.ts` con un registro `id → componente`. Deja el patrón para Tetris y Arkanoid. Decisión del usuario.
- **No:** `if (id === "rocas")` dentro de `GamePlayer`. Cada juego nuevo obligaría a tocarlo.
- **No:** crear una entrada nueva `asteroids`. Duplicaría el catálogo.
- **Sí:** HUD de React y modal existente para fin de partida y guardado. Mantiene el diseño de la plataforma. Decisión del usuario.
- **No:** HUD y "GAME OVER" dibujados en canvas. Duplicarían información y no guardarían puntuación.
- **Sí:** conservar el indicador `3x` del powerup en canvas. No es una estadística del HUD de la plataforma y no tiene hueco en él.
- **Sí:** vectores blancos fieles al original, canvas escalado por CSS. Decisión del usuario.
- **No:** restilizar a neón ni controles táctiles en esta spec. Cada uno merece su propia spec.
- **Sí:** el flujo mock (reducer + `setInterval`) se mantiene para juegos sin motor. Evita romper los otros 7 juegos del catálogo.
- **Sí:** `onGameOver` se dispara al instante al perder la última vida; el modal aparece sobre el canvas con las partículas de la explosión congeladas. Simple y sin temporizadores extra.
- **No:** reinicio con `Espacio` en el canvas. Sustituido por "JUGAR DE NUEVO" del modal.

## Riesgos identificados

| Riesgo                                                                                            | Mitigación                                                                                                                     |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Next 16.3.7 con cambios incompatibles (ver `AGENTS.md`); `node_modules/next/dist/docs/` no existe | Verificar firmas en los tipos de `node_modules/next`; el componente de juego es client puro y no usa APIs nuevas del framework |
| React Strict Mode monta/desmonta el efecto dos veces en desarrollo y duplica loops                | `destroy()` cancela el `requestAnimationFrame` y quita los listeners; criterio de aceptación lo verifica                       |
| El teclado dispara scroll de página o el foco queda en un botón y `Espacio` lo activa             | `preventDefault` en las teclas de juego mientras corre; revisar que `Espacio` no pulse PAUSA/FIN                               |
| Muchos `onStats` provocan re-renders por frame                                                    | Llamar `onStats` solo cuando cambia score, vidas o nivel, nunca por frame                                                      |
| `dt` enorme al reanudar o volver a la pestaña                                                     | Capado a 50 ms y `lastTime` se reinicia en `resume`                                                                            |
| Estado `justPressed` heredado entre partidas                                                      | Limpiar `keys` y `justPressed` en `restart`, `pause` y `destroy`                                                               |
| Fricción con tipado estricto al portar clases con campos dinámicos                                | Declarar campos explícitos en cada clase; sin `any`                                                                            |

## Qué **no** está en esta spec

- Controles táctiles / versión móvil.
- Restilizado neón del dibujo.
- Motores de los demás juegos.
- Sonido.
- Persistencia en Supabase.
- OVNIs.
- Datos reales para `best` y `plays`.
- Tests automatizados.

Cada punto, si se aborda, va en su propia spec.
