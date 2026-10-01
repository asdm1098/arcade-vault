# SPEC 01 — MVP visual de Arcade Vault

> **Status:** Aprovado
> **Depends on:** Ninguna
> **Date:** 2026-10-01
> **Objective:** Portar a Next.js (App Router) las 5 pantallas de `references/templates` (biblioteca, detalle, reproductor, auth, salón de la fama) como MVP solo visual, con datos mock y sin ningún juego real.

---

## Por qué existe esta spec

El repo es el scaffold de Create Next App con tema (`app/globals.css`), fuentes y fondo (`app/layout.tsx`) ya aplicados. Existe un prototipo en React UMD + Babel (`references/templates/*.jsx`) que sirve como referencia visual y de comportamiento. Esta spec lo convierte en código Next.js idiomático. El prototipo es la fuente de verdad del diseño: no se rediseña nada.

## Alcance

**Dentro:**

- Navbar global (logo, links, contador de créditos, botón sesión, menú móvil) y footer, en `app/layout.tsx`.
- Pantalla Biblioteca (`/`): hero, búsqueda por nombre, chips de categoría, grid de tarjetas con efecto tilt, estado vacío.
- Pantalla Detalle (`/juegos/[id]`): portada, tags, descripción, stats, leaderboard top 10 mock, botones jugar / volver.
- Pantalla Reproductor (`/juegos/[id]/jugar`): HUD, CRT con arena decorativa, puntaje simulado por intervalo, pausa, FIN, modal de game over con guardado en `localStorage`.
- Pantalla Auth (`/auth`): tabs iniciar sesión / crear cuenta, formulario, invitado, botones sociales decorativos.
- Pantalla Salón de la Fama (`/salon`): tabs por juego, podio top 3, tabla, fila "tu mejor marca" si hay sesión.
- Sesión mock en `localStorage` expuesta por un Context.
- Datos mock tipados portados de `data.jsx`.
- Responsive según los media queries ya presentes en `app/globals.css`.

**Fuera de alcance (specs futuras):**

- Cualquier juego jugable (lógica, canvas, input de teclado/táctil).
- Autenticación real (backend, OAuth Google/GitHub, validación, recuperación de contraseña).
- Base de datos, API o Route Handlers.
- Leaderboards reales: el guardado en `av_scores` no se lee en ninguna pantalla.
- Sistema de créditos real (el "03" es texto fijo).
- Tests automatizados (no hay runner configurado).
- Cambios al tema en `app/globals.css`, salvo que falte una clase usada por el prototipo.

## Modelo de datos

Archivo `lib/types.ts`:

```ts
export type Category = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export interface Game {
  id: string;        // slug, p. ej. "bloque-buster"
  title: string;
  short: string;
  long: string;
  cat: Category;
  cover: string;     // clase CSS, p. ej. "cover-bricks"
  color: GameColor;
  best: number;
  plays: string;     // ya formateado, p. ej. "12.4K"
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;      // "DD/MM/2026"
}

export interface SessionUser {
  name: string;      // mayúsculas, máx. 10 caracteres
}

export interface SavedScore {
  game: string;      // Game.id
  score: number;
  name: string;
  at: number;        // Date.now()
}
```

Archivo `lib/data.ts`: exporta `GAMES: Game[]` (8 juegos, copiados de `data.jsx`), `CATS` (`"TODOS"` + categorías), `PLAYERS` y `seededScores(seed, count)` (misma implementación determinista).

Claves de `localStorage`:

- `av_user`: `SessionUser` serializado, ausente si no hay sesión.
- `av_scores`: `SavedScore[]` serializado.

Convenciones:

- Números con `toLocaleString("es-ES")`.
- Textos de UI en español, igual que el prototipo.
- Acceso a `localStorage` siempre dentro de `try/catch`.

## Plan de implementación

1. Crear `lib/types.ts` y `lib/data.ts`. Agregar `references/**` a `globalIgnores` en `eslint.config.mjs` (los `.jsx` del prototipo usan `React` global y rompen `pnpm lint`). Verificar con `pnpm lint` y `pnpm build`.
2. Crear `components/session-provider.tsx` (`"use client"`): Context con `user`, `login(user | null)`, `signOut()`. Lee `av_user` en `useEffect`, no durante el render. Envolver `children` en `app/layout.tsx`.
3. Crear `components/nav.tsx` (`"use client"`) con links, créditos, botón sesión y panel móvil. Crear `components/footer.tsx`. Montar ambos en `app/layout.tsx` alrededor de `<main className="av-main">`. Verificar que se ven en `/`.
4. Biblioteca: `app/page.tsx` (server) con hero; `components/library-grid.tsx` (`"use client"`, búsqueda + chips + estado vacío); `components/game-card.tsx` (`"use client"`, tilt). Navegación con `next/link` a `/juegos/[id]`.
5. Detalle: `app/juegos/[id]/page.tsx` (server). `params` se resuelve según los tipos instalados de `next` (verificar en `node_modules/next`). Id inexistente llama a `notFound()`. Leaderboard con `seededScores(id.length * 17 + 3, 10)`.
6. Salón: `app/salon/page.tsx` (server, título) y `components/hall-of-fame.tsx` (`"use client"`, tabs, podio, tabla, fila del usuario con `useSession`).
7. Auth: `app/auth/page.tsx` (server) y `components/auth-form.tsx` (`"use client"`). Submit llama `login({ name })` y redirige a `/` con `router.push`. Invitado llama `login(null)` y redirige.
8. Reproductor: `app/juegos/[id]/jugar/page.tsx` (server, valida id) y `components/game-player.tsx` (`"use client"`) con HUD, CRT, pausa, FIN, modal y guardado en `av_scores`. Limpiar el `setInterval` al desmontar.
9. Crear `app/not-found.tsx` con estilo del tema para id inválido. Actualizar `metadata` por pantalla (`title`).
10. Revisar visualmente cada pantalla contra `references/templates/Arcade Vault.html` en desktop y móvil. Eliminar cualquier resto del scaffold.

## Criterios de aceptación

- [ ] `pnpm lint` termina sin errores.
- [ ] `pnpm build` termina sin errores.
- [ ] `/` muestra 8 tarjetas de juego con portada, categoría, descripción y mejor puntuación.
- [ ] Escribir "caí" en el buscador deja solo la tarjeta CAÍDA; no se distingue mayúsculas.
- [ ] Elegir el chip SHOOTER muestra exactamente INVASORES y ROCAS.
- [ ] Una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] Clic en una tarjeta o en su botón JUGAR navega a `/juegos/<id>`.
- [ ] `/juegos/caida` muestra título, descripción, 3 stats y 10 filas de leaderboard con las 3 primeras destacadas.
- [ ] `/juegos/no-existe` y `/juegos/no-existe/jugar` muestran la pantalla not-found.
- [ ] "JUGAR AHORA" lleva a `/juegos/<id>/jugar` y "VOLVER AL VAULT" a `/`.
- [ ] En el reproductor el puntaje aumenta cada ~220 ms; PAUSA lo detiene y REANUDAR lo retoma.
- [ ] FIN abre el modal con el puntaje final; GUARDAR PUNTUACIÓN escribe una entrada en `localStorage["av_scores"]` y muestra "PUNTUACIÓN GUARDADA".
- [ ] JUGAR DE NUEVO reinicia puntaje, vidas y nivel; SALIR vuelve a `/juegos/<id>`.
- [ ] El campo de iniciales del modal convierte a mayúsculas y limita a 10 caracteres.
- [ ] En `/auth` cambiar de tab muestra u oculta el campo de correo y cambia el texto del botón principal.
- [ ] Enviar el formulario con usuario "kai" guarda `av_user = {"name":"KAI"}`, redirige a `/` y el navbar muestra "KAI ▾".
- [ ] Con sesión, clic en el nombre del navbar cierra sesión y vuelve a mostrar "Iniciar Sesión".
- [ ] "JUGAR COMO INVITADO" redirige a `/` sin sesión.
- [ ] Recargar la página con sesión iniciada conserva el nombre en el navbar.
- [ ] `/salon` muestra podio con 3 posiciones, 12 filas en la tabla y un tab por cada juego (8).
- [ ] Cambiar de tab en `/salon` cambia los datos del podio y de la tabla.
- [ ] La fila "TU MEJOR MARCA" aparece en `/salon` solo con sesión iniciada.
- [ ] El link activo del navbar es Biblioteca en `/`, `/juegos/*` y `/juegos/*/jugar`, y Salón de la Fama en `/salon`.
- [ ] En ancho ≤ 768 px aparece el botón hamburguesa y abre/cierra el panel móvil.
- [ ] Con `localStorage` bloqueado ninguna pantalla lanza error.
- [ ] No hay errores de hidratación en la consola de ninguna pantalla.
- [ ] Solo los componentes listados llevan `"use client"`; las `page.tsx` son server components.

## Decisiones tomadas y descartadas

- **Sí:** rutas App Router (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/auth`, `/salon`). URLs reales, compartibles y con back del navegador.
- **No:** SPA con estado + hash como `app.jsx`. Descarta lo que Next ya da.
- **Sí:** sesión mock con `localStorage` + Context (`av_user`). Replica el prototipo y permite ver estados con/sin sesión.
- **No:** sesión real o cookies. Pertenece a una spec de autenticación.
- **Sí:** reproductor igual al prototipo, con puntaje simulado y guardado en `av_scores`. Deja el flujo completo listo para cuando exista un juego real.
- **No:** leer `av_scores` en el salón. Los datos del salón siguen siendo mock, para no mezclar alcance.
- **Sí:** datos mock tipados en `lib/data.ts`. Sin API ni DB: es un MVP visual.
- **No:** Route Handlers para servir mocks. Capa innecesaria.
- **Sí:** server components por defecto y `"use client"` solo donde hay estado, efectos o eventos. Menos JS en cliente.
- **No:** portar todo como client. Más simple, pero peor rendimiento sin beneficio.
- **Sí:** reutilizar `app/globals.css` tal cual. Ya contiene el CSS del prototipo.
- **Sí:** `seededScores` determinista. Evita diferencias servidor/cliente en la hidratación.

## Riesgos identificados

| Riesgo | Mitigación |
| ------ | ---------- |
| Next 16.3.7 tiene cambios incompatibles frente a lo conocido (ver `AGENTS.md`); `node_modules/next/dist/docs/` no existe | Verificar firmas (`params`, `LayoutProps`, `notFound`, `useRouter`) en los tipos de `node_modules/next` antes de escribir cada página |
| Error de hidratación al leer `localStorage` en el render | Leer `av_user` solo en `useEffect`; renderizar estado "sin sesión" hasta montar |
| `Math.random` en el puntaje simulado causa mismatch SSR | Puntaje inicial fijo en 0; el azar solo corre dentro del `setInterval` en cliente |
| `localStorage` bloqueado o corrupto | `try/catch` en toda lectura/escritura; si falla, la app funciona sin persistir |
| Clases CSS del prototipo ausentes en `globals.css` | Verificado al crear la spec: `globals.css` es idéntico a `styles.css` salvo `@import "tailwindcss"` y el selector `#root`; no se espera trabajo extra |

## Qué **no** está en esta spec

- Ningún juego jugable ni lógica de juego real.
- Autenticación real, OAuth, base de datos o API.
- Leaderboards reales o lectura de `av_scores`.
- Créditos funcionales.
- Tests automatizados.
- Rediseño o cambios al tema visual.

Cada punto, si se aborda, va en su propia spec.
