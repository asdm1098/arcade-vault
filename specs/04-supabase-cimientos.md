# SPEC 04 — Cimientos de Supabase en Next.js

> **Status:** Aprobado
> **Depends on:** SPEC 03
> **Date:** 2026-10-03
> **Objective:** Dejar Supabase integrado en la app (SDK, clientes de servidor y navegador, variables de entorno y health check) sin cambiar ninguna pantalla ni crear tablas.

---

## Por qué existe esta spec

Hoy el login y las puntuaciones son mock en `localStorage` (`SessionProvider`, `GamePlayer`). Migrarlos a Supabase toca Auth, esquema y UI a la vez: demasiado para una spec. Esta spec solo deja la infraestructura lista y verificada; Auth y datos van en specs posteriores. El proyecto Supabase (`ryurmmkvooxnyxibuxve`) ya existe, está enlazado en `.mcp.json` y tiene la BD vacía (sin tablas ni migraciones).

## Alcance

**Dentro:**

- Instalar `@supabase/supabase-js` y `@supabase/ssr`.
- Cliente de navegador `lib/supabase/client.ts` y cliente de servidor `lib/supabase/server.ts` (cookies de Next).
- Variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local` y `.env.example`.
- Route Handler `app/api/health/supabase/route.ts` que verifica la conexión con el proyecto.

**Fuera de alcance (specs futuras):**

- Supabase Auth: sustituir `SessionProvider`/`auth-form` y el método de login.
- `proxy.ts` de refresco de sesión (va con Auth, sin sesión no hay nada que refrescar).
- Tablas, migraciones, RLS y `supabase/migrations`.
- Mover puntuaciones, perfiles o catálogo de juegos a Postgres.
- Tipos generados de la BD (`database.types.ts`).
- Realtime, Storage y Edge Functions.
- Cliente con `service_role` (la clave secreta no se usa ni se guarda en esta spec).
- Tests automatizados.

## Modelo de datos

Esta spec no introduce estructuras de datos ni tablas. No cambia `lib/types.ts` ni las claves de `localStorage`.

Variables de entorno (se exponen al cliente porque la publishable key es pública por diseño; la seguridad la dará RLS en specs futuras):

```
NEXT_PUBLIC_SUPABASE_URL=                  # https://ryurmmkvooxnyxibuxve.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=      # sb_publishable_...
```

Convenciones:

- Los clientes viven en `lib/supabase/` y se crean por llamada (`createClient()`), sin singletons de módulo en servidor.
- `lib/supabase/server.ts` es `async` y usa `cookies()` de `next/headers`.
- `.env.example` documenta ambas variables sin valores; `SUPABASE_DB_PASSWORD` ya existente en `.env.local` no se usa en código.

## Plan de implementación

1. Instalar dependencias con `pnpm add @supabase/supabase-js @supabase/ssr`. Verificar con `pnpm build`.
2. Obtener URL y publishable key del proyecto (MCP `get_project_url` y `get_publishable_keys`), agregarlas a `.env.local` y documentarlas sin valores en `.env.example`.
3. Crear `lib/supabase/client.ts` con `createClient()` basado en `createBrowserClient` de `@supabase/ssr`. Verificar con `pnpm lint`.
4. Crear `lib/supabase/server.ts` con `createClient()` async basado en `createServerClient` y `cookies()`; `setAll` tolera el error de escritura en Server Components. Verificar con `pnpm build`.
5. Crear `app/api/health/supabase/route.ts` (`GET`): usa el cliente de servidor y consulta `GET <URL>/auth/v1/health` con el header `apikey`; responde `200 { ok: true }` o `503 { ok: false }` sin lanzar excepciones ni exponer claves. Probar con `pnpm dev` y `curl /api/health/supabase`.
6. Verificar que las variables y las claves no se filtran: revisar con grep que `.env.local` sigue ignorado por git y que el bundle solo contiene la publishable key (nunca `SUPABASE_DB_PASSWORD`).

## Criterios de aceptación

- [ ] `pnpm lint` termina sin errores.
- [ ] `pnpm build` termina sin errores.
- [ ] `package.json` incluye `@supabase/supabase-js` y `@supabase/ssr`.
- [ ] Existen `lib/supabase/client.ts` y `lib/supabase/server.ts`, cada uno exporta `createClient`.
- [ ] `.env.example` lista `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` sin valores y `.env.local` no está trackeado por git.
- [ ] `GET /api/health/supabase` con credenciales correctas responde `200` con `{ "ok": true }`.
- [ ] Con `NEXT_PUBLIC_SUPABASE_URL` ausente o inválida, `GET /api/health/supabase` responde `503` con `{ "ok": false }` sin romper el servidor.
- [ ] La respuesta del health check no contiene la URL ni las claves.
- [ ] `SUPABASE_DB_PASSWORD` no aparece en `.next/static` (búsqueda sin coincidencias).
- [ ] Ninguna pantalla existente cambia: `/`, `/games`, `/juegos/*`, `/salon`, `/auth` y `/acerca-de` cargan igual que antes.
- [ ] No hay archivos nuevos con `"use client"` en esta spec.
- [ ] La BD sigue sin tablas ni migraciones (MCP `list_tables` y `list_migrations` vacíos).

## Decisiones tomadas y descartadas

- **Sí:** esta spec solo cubre cimientos. Auth, esquema y datos son demasiado para una sola spec (tocan 3+ áreas). Decisión del usuario.
- **No:** incluir Auth o puntuaciones ahora. Se mezclaría infraestructura con rediseño de flujos existentes.
- **Sí:** publishable key (`sb_publishable_`) en `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Es el estándar actual de Supabase. Decisión del usuario.
- **No:** anon key legacy (JWT). Formato antiguo.
- **Sí:** `@supabase/ssr` con clientes separados de navegador y servidor. Es el patrón oficial para App Router con cookies.
- **No:** un único cliente global de `supabase-js`. No funciona bien con cookies por petición en servidor.
- **No:** `proxy.ts` en esta spec. Sin Auth no hay sesión que refrescar y tocaría el routing sin beneficio. Decisión del usuario.
- **Sí:** health check en `/api/health/supabase`. Permite verificar la conexión sin tablas y sirve luego como diagnóstico. Decisión del usuario.
- **No:** tabla de prueba o script descartable. La tabla mete esquema no requerido; el script no deja nada reutilizable.
- **No:** tipos generados por ahora. Sin tablas serían vacíos; se generan en la spec de datos.
- **No:** `service_role` key. Sin necesidad hoy, y guardarla ampliaría el riesgo de filtración.

## Riesgos identificados

| Riesgo                                                                                     | Mitigación                                                                                                                   |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Next 16.3.7 con cambios incompatibles (ver `AGENTS.md`) en `cookies()` o Route Handlers    | Leer `node_modules/next/dist/docs/01-app` y verificar firmas en los tipos de `node_modules/next` antes de escribir el código |
| Versión de `@supabase/ssr` que no soporte la API de cookies (`getAll`/`setAll`) de Next 16 | Revisar el README/tipos del paquete instalado; fijar versión compatible                                                      |
| Publishable key expuesta al cliente                                                        | Es pública por diseño; sin RLS no hay tablas que proteger hoy, y RLS es requisito de la spec de datos                        |
| Confundir claves (`service_role`/secret en variable `NEXT_PUBLIC_`)                        | Solo se usa la publishable key; criterio de aceptación revisa el bundle                                                      |
| `.env.local` con secretos subido al repo                                                   | `.gitignore` ya ignora `.env*`; solo `.env.example` sin valores se versiona                                                  |
| Health check público revela estado del servicio                                            | Respuesta mínima `{ ok }` sin detalles; aceptado para el MVP                                                                 |

## Qué **no** está en esta spec

- Supabase Auth y cambio del login mock.
- `proxy.ts` de sesión.
- Tablas, migraciones, RLS y tipos generados.
- Migración de puntuaciones, perfiles o catálogo a Postgres.
- Realtime, Storage, Edge Functions y `service_role`.
- Tests automatizados.

Cada punto, si se aborda, va en su propia spec.
