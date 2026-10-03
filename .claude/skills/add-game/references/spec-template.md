# Adaptaciones del repo para la spec de un juego

Complementa (no reemplaza) la skill `/spec` y su `template.md`. Leer primero esos dos; aquí solo lo propio de Arcade Vault. Modelos reales: `specs/05-juego-asteroides.md`, `specs/06-leaderboard-y-tabla-juegos.md`.

## Convenciones del repo

- Español.
- Header como en specs 05/06:

```markdown
# SPEC NN — <Juego> jugable en el player

> **Status:** Borrador
> **Depends on:** SPEC 05, SPEC 06
> **Date:** YYYY-MM-DD
> **Objective:** Una frase: portar/crear <juego> como motor TS y conectarlo a /juegos/<id>/jugar con su leaderboard.
```

- Estados: `Borrador` → `Aprobado` → `Implementado` (o `Obsoleto`). Siempre `Borrador` al guardar.
- Secciones en este orden: Por qué existe · Alcance (Dentro / Fuera) · Modelo de datos · Plan de implementación · Criterios de aceptación · Decisiones tomadas y descartadas · Riesgos identificados · Qué **no** está en esta spec.
- Plan: pasos numerados, cada uno con su verificación (`pnpm lint`, `pnpm build`, `pnpm dev`).

## Contenido propio de un juego

**Por qué existe:** origen (`references/started-games/<carpeta>` o desde cero) y por qué no sirve tal cual (script global, DOM, rAF sin cancelar).

**Alcance dentro (siempre):** motor `lib/games/<slug>/engine.ts` con mecánica fiel al original; canvas `components/games/<slug>-canvas.tsx`; entrada en `registry`; catálogo (fila existente o migración); guardado vía `POST /api/scores`; HUD de React; PAUSA/FIN/JUGAR DE NUEVO con el motor real.

**Alcance fuera (típico):** controles táctiles, restilizado neón, sonido (salvo decisión), otros juegos, anti-trampas, tests automatizados.

**Modelo de datos:** constantes del original que se conservan (tamaños, velocidades, puntos, niveles), tipos locales del motor, `GameStats` mapeado (qué es `lives` y `level` si el juego no los tiene), canvas `W×H`, teclas. Fila de `games` a reutilizar/crear (`id`,`title`,`cat`,`cover`,`color`,`sort_order`). Si no cambia el esquema, decirlo explícito.

**Criterios de aceptación (mínimos, adaptar):**

- [ ] `pnpm lint` y `pnpm build` sin errores.
- [ ] `/juegos/<id>/jugar` muestra el canvas con el estado inicial correcto.
- [ ] Controles listados responden; la página no hace scroll al pulsarlos.
- [ ] Reglas de puntuación concretas (X puntos por Y) reflejadas en el HUD.
- [ ] Condición de game over abre "FIN DEL JUEGO" con puntuación final correcta, una sola vez.
- [ ] "FIN", "PAUSA/REANUDAR" y "JUGAR DE NUEVO" funcionan sin salto de movimiento.
- [ ] "GUARDAR PUNTUACIÓN" inserta fila en `scores` con `game_id='<id>'` y aparece en `/salon?juego=<id>`.
- [ ] Navegar y volver no duplica loop ni listeners; Strict Mode un solo loop.
- [ ] El motor no contiene `document.`, `getElementById` ni globals mutables de módulo.
- [ ] Sin scroll horizontal en ≤ 768 px; sin errores en consola.
- [ ] Un juego sin motor conserva la arena mock.

**Decisiones típicas:** motor TS vs iframe/`next/script` (No: no comunica score ni se limpia); HUD en React vs canvas (React); reutilizar fila del catálogo vs duplicar (reutilizar); sonido dentro/fuera.

**Riesgos típicos:** Strict Mode duplica loops; teclado dispara scroll/botones; `dt` enorme al volver a la pestaña; estado de input heredado entre partidas; tipado estricto al portar clases; assets (sprites/audio) y rutas en `public/`.
