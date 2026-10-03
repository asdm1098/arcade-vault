# Checklist de integración

## Archivos

| Qué | Dónde |
| --- | --- |
| Motor | `lib/games/<slug>/engine.ts` |
| Canvas React | `components/games/<slug>-canvas.tsx` (props `GameCanvasProps`) |
| Registry | `lib/games/registry.ts` → `GAME_COMPONENTS[<id>]` |
| Assets | `public/games/<slug>/` |
| Catálogo | fila en `games` (migración nueva si falta) |
| Spec | `specs/NN-juego-<slug>.md` |

`<id>` = `games.id` (slug de catálogo, ej. `caida`, `bloque-buster`), puede diferir del nombre de carpeta del motor.

## Migración de catálogo (solo si no existe la fila)

- Archivo `supabase/migrations/<YYYYMMDDHHMMSS>_add_<id>.sql`, aplicar con MCP `apply_migration`.
- `insert into public.games (id,title,short,long,cat,cover,color,sort_order)`; `cat` ∈ ARCADE|PUZZLE|SHOOTER|VERSUS; `color` ∈ cyan|magenta|yellow|green; `sort_order` siguiente libre.
- Seed ~12 scores decrecientes, últimos 30 días, nombres de la lista del seed de `*_games_and_scores.sql`, rango acorde al juego.
- `cover` = clase CSS existente en `app/globals.css` (`cover-bricks`, `cover-tetro`…) o nueva.
- No tocar migraciones aplicadas; cambios de título = migración `update`.
- Si cambia el esquema: regenerar `lib/supabase/database.types.ts` (`generate_typescript_types`).

## Guardado y leaderboard (ya resueltos por SPEC 06)

- `GamePlayer` hace `POST /api/scores {game, score, name}` y `router.refresh()`.
- `/salon?juego=<id>`, `/games`, `/juegos/<id>`, home leen de `games`/`scores`/`game_stats`. Sin código extra por juego.

## Verificación

1. `pnpm lint` y `pnpm build` sin errores.
2. `grep` engine: sin `document.`, `getElementById`, ni `let`/`var` mutables a nivel de módulo.
3. MCP supabase: `list_tables` (RLS on), `get_advisors` security limpio, `select count(*) from scores where game_id='<id>'` ≥ 10.
4. `pnpm dev` + Playwright, `/juegos/<id>/jugar`:
   - canvas visible, proporción correcta, sin scroll horizontal ≤ 768 px;
   - controles responden y no hacen scroll de página;
   - HUD (puntuación/vidas/nivel) se actualiza;
   - PAUSA congela y REANUDAR sin salto; FIN abre modal con score actual; JUGAR DE NUEVO reinicia;
   - Game over natural abre modal una sola vez;
   - GUARDAR PUNTUACIÓN → 201, fila en `scores`, visible en `/salon?juego=<id>` (tras revalidate 30 s);
   - navegar fuera y volver no duplica loop/listeners; Strict Mode un solo loop;
   - consola del navegador sin errores.
5. Un juego sin motor (ej. `/juegos/gloton/jugar`) conserva la arena mock.
6. Screenshots en `.playwright-screenshots/<nombre>.png`, desktop y móvil.
7. Spec → `Implementado`.
