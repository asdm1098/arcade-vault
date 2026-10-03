# SPEC 06 — Leaderboard y tabla de juegos en Supabase

> **Status:** Aprobado
> **Depends on:** SPEC 04, SPEC 05
> **Date:** 2026-10-03
> **Objective:** Crear las tablas `games` y `scores` en Supabase y conectar catálogo, Salón de la Fama, home y guardado de puntuaciones a esos datos reales, sustituyendo los mocks de `lib/data.ts` y `localStorage`.

---

## Por qué existe esta spec

SPEC 04 dejó los clientes de Supabase listos con la BD vacía. SPEC 05 hizo jugable `rocas`, pero su puntuación sigue en `localStorage` (`av_scores`) y el Salón, la home y el detalle de juego muestran datos inventados (`seededScores`, `ACTIVITY`, `TOP_PLAYERS`, `best`, `plays`). Esta spec es la primera que usa la BD: crea el esquema con RLS y mueve a Postgres lo que hoy es mock. Sin Supabase Auth: el nombre sigue siendo el del login mock.

## Alcance

**Dentro:**

- Migración con tablas `games` y `scores`, vista `game_stats`, RLS y seed (8 juegos de `lib/data.ts` + ~10 puntuaciones ficticias por juego).
- Tipos generados `lib/supabase/database.types.ts` y clientes `lib/supabase/client.ts` / `server.ts` tipados con ellos.
- Capa de datos de servidor `lib/queries.ts`: `getGames`, `getGame`, `getTopScores`, `getRecentActivity`, `getTopPlayers`.
- Route Handler `app/api/scores/route.ts` (`POST`) para guardar una puntuación con validación.
- Páginas que leen de BD (Server Components): `/games`, home `/`, `/salon`, `/juegos/[id]` y `/juegos/[id]/jugar`.
- `GamePlayer`: "GUARDAR PUNTUACIÓN" hace `POST /api/scores` en lugar de escribir `av_scores`.
- Estados vacío y error en cada lectura (BD sin filas o Supabase caído).
- Eliminar de `lib/data.ts` lo que pasa a BD: `GAMES`, `PLAYERS`, `seededScores`, `ACTIVITY`, `TOP_PLAYERS`.

**Fuera de alcance (specs futuras):**

- Supabase Auth, perfiles y autoría real de puntuaciones (el nombre es texto libre).
- Anti-trampas: puntuaciones verificadas en servidor, firma de partida, rate limit.
- Realtime / actualización en vivo del ranking.
- Migrar puntuaciones existentes de `av_scores`.
- Paginación del ranking (se muestra el top 20).
- Panel de administración para editar el catálogo.
- Motores de los otros 7 juegos (siguen con la arena mock; sí pueden guardar puntuación).
- Cambiar `HOME_STATS` y demás textos estáticos de la home.
- Tests automatizados.

## Modelo de datos

Migración `supabase/migrations/<timestamp>_games_and_scores.sql` (aplicada con el MCP `apply_migration`):

```sql
create table public.games (
  id         text primary key,            -- slug: "rocas"
  title      text not null,
  short      text not null,
  long       text not null,
  cat        text not null check (cat in ('ARCADE','PUZZLE','SHOOTER','VERSUS')),
  cover      text not null,               -- clase CSS: "cover-bricks"
  color      text not null check (color in ('cyan','magenta','yellow','green')),
  sort_order int  not null
);

create table public.scores (
  id         bigint generated always as identity primary key,
  game_id    text not null references public.games(id),
  name       text not null check (char_length(name) between 1 and 10),
  score      int  not null check (score between 0 and 100000000),
  created_at timestamptz not null default now()
);
create index scores_game_score_idx on public.scores (game_id, score desc);
create index scores_created_idx    on public.scores (created_at desc);

create view public.game_stats with (security_invoker = true) as
  select g.id as game_id,
         coalesce(max(s.score), 0) as best,
         count(s.id)::int          as plays
  from public.games g left join public.scores s on s.game_id = g.id
  group by g.id;
```

RLS (activado en ambas tablas):

- `games`: `select` para `anon` y `authenticated`; sin `insert/update/delete`.
- `scores`: `select` e `insert` para `anon` y `authenticated`; sin `update/delete`.

Tipos TypeScript (adaptan filas de BD al modelo de `lib/types.ts`, que se conserva):

```ts
// lib/types.ts — Game conserva sus campos; best y plays se rellenan desde game_stats
// plays se formatea en lib/queries.ts: 842 -> "842", 12400 -> "12.4K"
// ScoreRow { rank, name, score, date } se conserva; date = "DD/MM/YYYY" desde created_at
// ActivityRow.ago se calcula en servidor: "hace 2 min" | "hace 3 h" | "hace 2 d"
// SavedScore y la clave av_scores dejan de usarse (se elimina SavedScore)
```

Convenciones:

- Seed determinista dentro de la migración: nombres de la lista `PLAYERS` actual, `created_at` repartidos en los últimos 30 días, puntuaciones decrecientes por juego en rangos acordes a cada juego (rocas hasta ~60 000, resto como hoy).
- `name` se guarda en mayúsculas, recortado a 10 caracteres (mismo formato que `SessionUser.name`).
- `TOP_PLAYERS` = mejor puntuación individual por `name` (agrupado), top 5, entre todos los juegos. `ACTIVITY` = últimas 7 filas de `scores` con título y `color` del juego.
- Datos en páginas con `revalidate` corto (30 s) o equivalente verificado en los tipos de Next 16.3.7; sin `service_role`.
- `POST /api/scores` recibe `{ game, score, name }`, valida (juego existe, `score` entero 0..100 000 000, `name` 1..10) y responde `201 { ok: true }`, `400 { ok: false, error: "invalid" }` o `503 { ok: false, error: "unavailable" }`. Nunca expone claves ni mensajes de Postgres.

## Plan de implementación

1. Inspeccionar la BD con MCP `list_tables`, escribir y aplicar la migración (tablas, índices, vista, RLS, seed de `games` y `scores`). Verificar con `list_tables` y un `select` de conteos vía `execute_sql`.
2. Ejecutar `get_advisors` (security) y corregir avisos de RLS. Generar `lib/supabase/database.types.ts` con `generate_typescript_types` y tipar `createClient` en `client.ts` y `server.ts`. Verificar con `pnpm build`.
3. Crear `lib/queries.ts` con `getGames`, `getGame`, `getTopScores(gameId, limit)`, `getRecentActivity`, `getTopPlayers` y los formateadores (`plays`, `date`, `ago`); devuelven los tipos de `lib/types.ts` y `[]`/`null` si la consulta falla. Verificar con `pnpm lint`.
4. Crear `app/api/scores/route.ts` (`POST`) con validación. Probar con `curl` (caso válido, `name` vacío, juego inexistente, score negativo). Verificar con `pnpm build`.
5. `/games` y `/juegos/[id]` (detalle): leer catálogo y ranking con `getGames`/`getGame`/`getTopScores`; pasar `games` por props a `LibraryGrid`/cards. `/juegos/[id]/jugar` obtiene `game` en servidor y lo pasa a `GamePlayer`. Quitar `GAMES` de `lib/data.ts` solo cuando ya no tenga usos. Verificar en `pnpm dev`.
6. Home `app/page.tsx`: vista previa de juegos, `ACTIVITY` y `TOP_PLAYERS` desde `getGames`, `getRecentActivity`, `getTopPlayers`, con estado vacío. Eliminar los mocks en `lib/data.ts`.
7. `/salon`: `app/salon/page.tsx` lee `searchParams.juego` (por defecto el primer juego), pide `getTopScores(juego, 20)` y pasa filas a `HallOfFame`; las pestañas pasan a `Link` con `?juego=`. Podio top 3 y tabla desde datos reales; la fila "TÚ" mock se sustituye por resaltar la fila cuyo `name` coincide con el de la sesión. Eliminar `seededScores` y `PLAYERS`.
8. `GamePlayer`: "GUARDAR PUNTUACIÓN" hace `POST /api/scores`, muestra estado guardando / guardado / error con reintento y llama `router.refresh()`; se elimina `SCORES_KEY` y `saveScore`. Verificar jugando `/juegos/rocas/jugar` de punta a punta.
9. Revisar `/`, `/games`, `/juegos/rocas`, `/salon` y `/juegos/rocas/jugar` en desktop y ancho ≤ 768 px, con screenshots en `.playwright-screenshots/`. Verificar `pnpm lint` y `pnpm build`.

## Criterios de aceptación

- [ ] `pnpm lint` termina sin errores.
- [ ] `pnpm build` termina sin errores.
- [ ] MCP `list_tables` muestra `games` y `scores` con RLS activado, y `list_migrations` incluye la migración.
- [ ] `select count(*) from games` devuelve 8 y cada juego tiene al menos 10 filas en `scores`.
- [ ] `get_advisors` (security) no reporta tablas sin RLS ni la vista `game_stats` como `SECURITY DEFINER`.
- [ ] Con la publishable key, `UPDATE` y `DELETE` sobre `scores` y cualquier escritura sobre `games` son rechazados por RLS.
- [ ] `POST /api/scores` con `{ game: "rocas", score: 1234, name: "TEST" }` responde `201` y la fila aparece en `scores`.
- [ ] `POST /api/scores` con `name` vacío, `name` de 11 caracteres, `score` negativo o decimal, o `game` inexistente responde `400` y no inserta nada.
- [ ] Jugar `rocas`, terminar y pulsar "GUARDAR PUNTUACIÓN" inserta una fila con el score y el nombre mostrados en el modal.
- [ ] Un fallo de red o `503` en el guardado muestra un mensaje de error y deja reintentar sin perder la puntuación.
- [ ] `localStorage["av_scores"]` ya no se escribe y `lib/data.ts` no contiene `GAMES`, `PLAYERS`, `seededScores`, `ACTIVITY` ni `TOP_PLAYERS`.
- [ ] `/salon` muestra podio top 3 y tabla ordenados por score desc para el juego de `?juego=`; cambiar de pestaña cambia la URL y los datos.
- [ ] `/salon?juego=inexistente` cae al primer juego o responde `notFound()`, sin error 500.
- [ ] Tras guardar una puntuación mayor que la del puesto 1 de `rocas`, `/salon?juego=rocas` la muestra primera (tras expirar el `revalidate`).
- [ ] En `/games`, `/` y el detalle del juego, `best` y `plays` coinciden con `max(score)` y `count(*)` de `scores` para ese juego.
- [ ] La home muestra las 7 últimas puntuaciones con `ago` relativo y el top 5 de jugadores desde BD.
- [ ] Con `scores` vacío (probado en rama o con filtro), Salón, home y detalle muestran estado vacío sin romper.
- [ ] Con `NEXT_PUBLIC_SUPABASE_URL` inválida, las páginas muestran estado de error sin excepción no controlada.
- [ ] `/juegos/caida/jugar` conserva la arena mock y también guarda su puntuación en BD.
- [ ] Ninguna página tiene scroll horizontal en ancho ≤ 768 px.
- [ ] No hay errores en la consola del navegador en `/`, `/games`, `/salon` y `/juegos/rocas/jugar`.
- [ ] `grep` no encuentra `service_role` ni `SUPABASE_DB_PASSWORD` en `.next/static`.

## Decisiones tomadas y descartadas

- **Sí:** tablas `games` y `scores` en una sola spec. El leaderboard necesita la FK a `games`. Decisión del usuario.
- **Sí:** `games` como catálogo completo en BD con seed. Una única fuente de verdad. Decisión del usuario.
- **No:** `games` mínima solo para la FK. Dejaría dos fuentes del catálogo.
- **Sí:** puntuación anónima con nombre libre e `insert` público bajo RLS. No hay Auth aún y cabe en el MVP. Decisión del usuario.
- **No:** exigir Supabase Auth ahora. Pide spec propia (sesión, `proxy.ts`, perfiles).
- **Sí:** escritura vía Route Handler `POST /api/scores`. Valida en servidor y deja un único punto donde añadir anti-trampas después. La RLS sigue permitiendo `insert` anónimo como segunda barrera.
- **No:** `insert` directo desde el navegador con `createClient()`. Duplica validación en cliente.
- **Sí:** `best` y `plays` derivados con la vista `game_stats`. Siempre coherentes con `scores`. Decisión del usuario.
- **No:** columnas fijas en `games`. Quedarían desfasadas al guardar puntuaciones.
- **Sí:** `ACTIVITY` y `TOP_PLAYERS` derivados de `scores`. Decisión del usuario.
- **Sí:** seed ficticio por migración. Salón y home no arrancan vacíos. Decisión del usuario.
- **No:** columna `is_seed`. Los datos seed se tratan como puntuaciones normales; borrarlos es una decisión futura.
- **Sí:** lectura en Server Components con `lib/supabase/server.ts` y `revalidate` corto. Decisión del usuario.
- **No:** fetch desde el navegador. Más JS en cliente y estados de carga por pantalla.
- **Sí:** pestañas del Salón por `?juego=`. Enlazable y renderizable en servidor.
- **Sí:** reemplazar `av_scores` sin migrar. Eran datos de demo locales. Decisión del usuario.
- **No:** escribir a ambos (BD y `localStorage`). Dos fuentes de verdad sin beneficio.
- **Sí:** quitar los mocks de `lib/data.ts` y mostrar estado vacío/error si falla Supabase. Un fallback silencioso a datos falsos ocultaría fallos.
- **Sí:** tipos generados (`database.types.ts`). SPEC 04 los dejó fuera por no haber tablas.
- **Sí:** se corrige la fila "TÚ" del Salón resaltando por nombre de sesión dentro del top 20. Evita una consulta extra de rango personal.

## Riesgos identificados

| Riesgo                                                                                  | Mitigación                                                                                                               |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `insert` público permite spam y puntuaciones falsas                                     | Aceptado en MVP; `check` de rango en BD y validación en el handler; anti-trampas en spec futura                          |
| Next 16.3.7 con cambios (`searchParams` asíncrono, caché/`revalidate`; ver `AGENTS.md`) | Verificar firmas en los tipos de `node_modules/next` antes de escribir páginas; `node_modules/next/dist/docs/` no existe |
| Vista `game_stats` ejecuta como propietario y salta RLS                                 | `security_invoker = true` y revisión con `get_advisors`                                                                  |
| Nombres ofensivos o con HTML en `name`                                                  | React escapa al renderizar; sin filtro de contenido en esta spec                                                         |
| Seed ficticio confundido con datos reales                                               | Documentado en decisiones; se puede borrar con un `delete` sin cambiar el esquema                                        |
| Consultas por juego y por fecha lentas al crecer `scores`                               | Índices `(game_id, score desc)` y `(created_at desc)`; límites fijos en las consultas                                    |
| Fallo de Supabase rompe todas las páginas                                               | `lib/queries.ts` devuelve vacío/`null` y las páginas renderizan estado de error                                          |
| Ranking desfasado hasta 30 s tras guardar                                               | Aceptado; `router.refresh()` en `GamePlayer` y `revalidate` corto                                                        |

## Qué **no** está en esta spec

- Supabase Auth, perfiles y autoría real.
- Anti-trampas, firma de partidas y rate limit.
- Realtime y paginación del ranking.
- Migración de `av_scores`.
- Panel de administración del catálogo.
- Motores de los demás juegos.
- Tests automatizados.

Cada punto, si se aborda, va en su propia spec.
