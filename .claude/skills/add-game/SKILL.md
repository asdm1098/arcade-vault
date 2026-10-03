---
name: add-game
description: Crea o porta un juego a Arcade Vault con su leaderboard e integración en la plataforma (motor TS con canvas, registry, catálogo en Supabase, guardado de puntuación). El juego puede venir de references/started-games o pedirse desde cero. Flujo spec-first. Usar con "agrega/porta/crea el juego X", "integra tetris/arkanoid", "nuevo juego con leaderboard".
argument-hint: "<NN-nombre en references/started-games | nombre de juego nuevo>"
---

# /add-game — Añadir un juego a Arcade Vault

Patrón fijado por SPEC 05 (motor + canvas + registry) y SPEC 06 (`games`/`scores`, `POST /api/scores`, Salón). Flujo **spec-first**: no se escribe código sin spec aprobada.

Argumento: `$ARGUMENTS` (carpeta de `references/started-games/` o nombre/idea del juego). Vacío → preguntar cuál.

Responder en español.

## Referencias del skill

- `references/engine-contract.md` — contrato y reglas del motor TS.
- `references/integration-checklist.md` — registry, catálogo BD, guardado, verificación.
- `references/spec-template.md` — adaptaciones del repo para la spec de un juego.

## Fase 1 — Resolver origen

1. Buscar `references/started-games/<arg>` (coincidencia parcial: `tetris` → `03-tetris`). Si existe, leer `CLAUDE.md`, `README.md`, `index.html`, `game.js` y, si hay, `levels.js`, `style.css`, `assets/`.
2. Si NO existe: es un juego desde cero. Mismo patrón. Preguntar solo lo que falte (controles, puntuación, vidas/niveles, tamaño de canvas, powerups) en un bloque de 3–5 preguntas con recomendación.
3. Leer los modelos: `lib/games/types.ts`, `lib/games/registry.ts`, `lib/games/asteroids/engine.ts`, `components/games/asteroids-canvas.tsx`, `components/game-player.tsx`, `app/api/scores/route.ts`.

## Fase 2 — Mapear al catálogo

1. Consultar `games` (MCP supabase `execute_sql`: `select id,title,cat,cover,color,sort_order from games order by sort_order`) y `supabase/migrations/`.
2. Mapeos conocidos: `02-asteroids` → `rocas` (hecho), `03-tetris` → `caida`, `04-arkanoid` → `bloque-buster`.
3. Hay fila → reutilizarla (no duplicar catálogo). No hay fila → la spec incluye migración nueva `supabase/migrations/<timestamp>_add_<id>.sql` (insert en `games` + seed de ~12 scores ficticios como la migración `*_games_and_scores.sql`) y, si hace falta, clase `.cover-*` en `app/globals.css`. Nunca editar migraciones ya aplicadas.

## Fase 3 — Spec (leer `/spec` primero)

**Antes de crear el archivo de spec, leer la skill `spec` y su plantilla**, en este orden de búsqueda:

1. `.claude/skills/spec/SKILL.md` + `template.md`
2. `.agents/skills/spec/SKILL.md` + `template.md`
3. Fallback: `references/started-games/04-arkanoid/.agents/skills/spec/SKILL.md` + `template.md`

Si no hay ninguna copia: avisar al usuario y usar `specs/05-*.md` y `specs/06-*.md` como modelo.

Luego seguir lo que dicte `/spec`: sus fases (contexto → preguntas en bloques → sección por sección con confirmación → guardar), sus reglas duras (sin código en la spec, sin asumir decisiones, objetivo en una frase, criterios booleanos, sección Decisiones, cierre "Qué no está") y su plantilla. Complementar con `references/spec-template.md` de este skill (secciones propias de un juego). Si el juego es demasiado grande, proponer dividirlo en specs.

Guardar en `specs/NN-juego-<slug>.md` (NN = siguiente número en `specs/`), estado `Borrador`, `Depends on: SPEC 05, SPEC 06`. Confirmar nombre de archivo con el usuario. **Nunca marcar `Aprobado` solo.** Parar y esperar aprobación del usuario.

## Fase 4 — Implementar (solo con spec `Aprobado`)

Rama `spec-NN-<slug>` (crearla si no existe). Un commit por paso del plan y pausa tras cada uno para revisar el diff. Por defecto los pasos son:

1. **Motor** `lib/games/<slug>/engine.ts` con `create<Nombre>(canvas, callbacks): GameHandle`, siguiendo `references/engine-contract.md`. Portar `game.js` quitando todo el DOM (HUD, overlays de pausa/game over, `getElementById`). Assets → `public/games/<slug>/`.
2. **Canvas** `components/games/<slug>-canvas.tsx` con el patrón de `asteroids-canvas.tsx` (misma `GameCanvasProps`). Si ya hay ≥2 juegos, evaluar extraer un `GameCanvas` genérico (`factory`, `width`, `height`) sin romper `rocas`.
3. **Registry** `lib/games/registry.ts`: añadir `id → componente`.
4. **Catálogo/BD**: migración si la Fase 2 la exigió; aplicar con MCP `apply_migration`, regenerar `lib/supabase/database.types.ts` si cambia el esquema.
5. **Player**: `components/game-player.tsx` solo se toca si el juego lo exige (aspect distinto, teclas). El guardado ya usa `POST /api/scores`; el leaderboard (`/salon?juego=<id>`, `/games`, detalle, home) funciona por `game_id` sin código extra.
6. **Verificación** completa según `references/integration-checklist.md`.

UI nueva → usar `/frontend-design` (regla del proyecto). Screenshots Playwright en `.playwright-screenshots/<nombre>.png`.

Al terminar y verificar: marcar la spec `Implementado`.

## Reglas duras

- Sin spec aprobada no hay código.
- Una fila por juego en `games`; el `id` es slug y no cambia.
- Sin `service_role` ni claves en cliente; el guardado pasa siempre por `/api/scores`.
- No escribir en `localStorage` (`av_scores` murió en SPEC 06).
- Next 16.3.7 difiere de lo conocido (ver `AGENTS.md`): verificar APIs en los tipos de `node_modules/next`.
- `pnpm lint` y `pnpm build` limpios antes de dar por cerrado.
