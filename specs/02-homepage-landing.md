# SPEC 02 — Homepage (landing) de Arcade Vault

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-10-02
> **Objective:** Convertir `/` en la landing del prototipo `references/templates/home-about` (hero, beneficios, juegos, stats, actividad, precios, CTA final) y mover la biblioteca actual a `/games`.

---

## Por qué existe esta spec

SPEC 01 dejó la biblioteca en `/`. El prototipo `references/templates/home-about` separa una landing (`home.jsx`) de la biblioteca y agrega "Inicio" al navbar. El prototipo es la fuente de verdad del diseño: no se rediseña nada. Esta spec solo porta el Home; la página "Acerca de" (`about.jsx`) queda fuera.

## Alcance

**Dentro:**

- Nueva `/` con 6 secciones + hero, portadas de `home.jsx`: hero con siluetas flotantes, "¿POR QUÉ ARCADE VAULT?" (4 feature cards), "JUEGOS DISPONIBLES AHORA" (mini-rail de 6 juegos), stats, "ACTIVIDAD EN VIVO" (ticker + top jugadores), "PRECIOS" (plan único + FAQ), CTA final.
- Animación de aparición al hacer scroll (`.reveal` + `IntersectionObserver`).
- Mover la biblioteca actual (hero + `LibraryGrid`) a `/games`.
- Navbar: agregar link "Inicio" (`/`); "Biblioteca" apunta a `/games`; logo apunta a `/`.
- Actualizar todo link "volver al vault" que apuntaba a `/` hacia `/games`.
- Copiar a `app/globals.css` los bloques CSS del Home que faltan.
- Constantes mock tipadas para actividad, top jugadores, stats, features y FAQ.

**Fuera de alcance (specs futuras):**

- Página "Acerca de" (`about.jsx`) y su link en el navbar.
- Datos reales de actividad, ranking o contadores (todo mock fijo).
- Registro/pago real (el plan "$0" es solo texto).
- Variantes de tema (`Theme variants`) y estilos `GAMEPAD` del prototipo.
- Renombrar `/juegos/[id]` a `/games/[id]`: las rutas de detalle y reproductor no cambian.
- Cambios al resto del tema o a las pantallas de SPEC 01, salvo los links indicados.

## Modelo de datos

Se agregan tipos a `lib/types.ts`:

```ts
export interface ActivityRow {
  player: string;   // p. ej. "NEONFOX"
  game: string;     // título visible, p. ej. "Caída"
  score: number;
  ago: string;      // ya formateado, p. ej. "hace 2 min"
  color: GameColor;
}

export interface TopPlayer {
  rank: number;
  player: string;
  score: number;
}

export interface Feature {
  icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";
  title: string;
  desc: string;
  color: GameColor;
}

export interface HomeStat {
  n: string;        // "12+", "MILES", "GLOBAL"
  unit: string;
  sub: string;
}

export interface FaqItem {
  q: string;
  a: string;
}
```

Se agregan a `lib/data.ts`: `FEATURES`, `HOME_STATS`, `ACTIVITY` (7 filas), `TOP_PLAYERS` (5 filas), `PRICING_FEATURES` (6 strings) y `FAQ` (3 items), copiados literalmente de `home.jsx`. La vista previa de juegos usa `GAMES.slice(0, 6)`.

Esta spec no introduce persistencia ni claves nuevas en `localStorage`.

Convenciones:

- Números con `toLocaleString("es-ES")`.
- Textos de UI en español, idénticos al prototipo.
- Los componentes de iconos y siluetas son SVG inline sin dependencias.

## Plan de implementación

1. Copiar a `app/globals.css` los bloques `/* ===== HOME PAGE ===== */` (incluye `.reveal`) y `/* ===== ACTIVITY ... ===== */` + `/* ===== PRICING ===== */` de `references/templates/home-about/styles.css`, más las reglas responsive de esas clases. No tocar reglas existentes. Verificar con `pnpm build`.
2. Mover la biblioteca: crear `app/games/page.tsx` con el contenido actual de `app/page.tsx` (hero + `LibraryGrid`, con `metadata` de título). Cambiar `Link href="/"` a `/games` en `components/game-player.tsx`, `app/juegos/[id]/page.tsx`, `app/not-found.tsx` y `app/salon/page.tsx` (botón que corresponda a "volver al vault"). Verificar `/games` igual al `/` anterior.
3. Actualizar `components/nav.tsx`: link "Inicio" a `/` (activo solo en `/`), "Biblioteca" a `/games` (activo en `/games` y `/juegos/*`), logo a `/`, mismo cambio en el panel móvil. Redirecciones de `components/auth-form.tsx` (`router.push("/")`) se mantienen en `/`.
4. Agregar tipos a `lib/types.ts` y constantes mock a `lib/data.ts`.
5. Crear `components/home/floating-silhouettes.tsx` (server, 8 SVG) y `components/home/feature-icon.tsx` (server).
6. Crear `components/home/reveal.tsx` (`"use client"`): wrapper que aplica `.reveal` y agrega `.in` con `IntersectionObserver` (threshold 0.12, `unobserve` tras la primera vez). Sin `IntersectionObserver` disponible, muestra el contenido de inmediato.
7. Crear `components/home/mini-card.tsx` (server, `Link` a `/juegos/[id]`).
8. Reescribir `app/page.tsx` (server) con hero y las secciones 01–04 y CTA final usando los componentes anteriores y `next/link` para los botones (`/games`, `/auth`, `/salon`). Actualizar `metadata` (`title`).
9. Revisar visualmente `/` contra `references/templates/home-about/arcade-vault-standalone.html` en desktop y móvil (screenshots en `.playwright-screenshots/`).

## Criterios de aceptación

- [ ] `pnpm lint` termina sin errores.
- [ ] `pnpm build` termina sin errores.
- [ ] `/` muestra el hero con eyebrow "INSERTA UNA MONEDA", título de 3 líneas y 8 siluetas decorativas.
- [ ] "EXPLORAR JUEGOS" navega a `/games` y "CREAR CUENTA" a `/auth`.
- [ ] La sección 01 muestra 4 feature cards (JUEGOS CLÁSICOS, 100% GRATIS, LADDER BOARDS, SIEMPRE CRECIENDO).
- [ ] La sección 02 muestra exactamente 6 mini-cards; clic en una navega a `/juegos/<id>`.
- [ ] "VER TODOS LOS JUEGOS →" navega a `/games`.
- [ ] La sección de stats muestra "12+", "MILES" y "GLOBAL".
- [ ] "ACTIVIDAD EN VIVO" muestra 7 filas de puntuaciones y 5 de top jugadores; las 3 primeras del top llevan clases `top1`, `top2`, `top3`.
- [ ] "VER SALÓN →" navega a `/salon`.
- [ ] La sección de precios muestra "$0 / SIEMPRE", 6 ítems y 3 preguntas de FAQ.
- [ ] "EMPEZAR GRATIS →" navega a `/auth` y "INSERTAR MONEDA →" a `/games`.
- [ ] Las secciones con `.reveal` empiezan ocultas y reciben `.in` al entrar en el viewport.
- [ ] `/games` muestra el mismo hero, buscador, chips y 8 tarjetas que antes mostraba `/`.
- [ ] Botones "VOLVER AL VAULT" (detalle, player, not-found, salón) navegan a `/games`.
- [ ] El navbar muestra Inicio, Biblioteca, Salón de la Fama; Inicio activo solo en `/`.
- [ ] Biblioteca queda activa en `/games`, `/juegos/*` y `/juegos/*/jugar`.
- [ ] El logo navega a `/`.
- [ ] En ancho ≤ 768 px la landing no tiene scroll horizontal y el panel móvil incluye "Inicio".
- [ ] No hay errores de hidratación en la consola de `/` ni de `/games`.
- [ ] Solo `components/home/reveal.tsx` (y los ya existentes de SPEC 01) llevan `"use client"`; `app/page.tsx` es server component.

## Decisiones tomadas y descartadas

- **Sí:** `/` es la landing y la biblioteca va a `/games`. Decisión del usuario; es lo que hace el prototipo (Inicio vs Biblioteca).
- **No:** dejar la biblioteca en `/` y poner el Home en otra ruta. Una landing que no es `/` no es homepage.
- **Sí:** `/games` en inglés aunque el detalle siga en `/juegos/[id]`. Se respeta la ruta pedida; unificar nombres de rutas sería otra spec.
- **Sí:** `/juegos/[id]` y `/juegos/[id]/jugar` sin cambios. Evita romper SPEC 01.
- **Sí:** "Acerca de" fuera de alcance; no se agrega link ni ruta. Evita un link roto o una página a medias.
- **Sí:** copiar solo los bloques CSS nuevos a `app/globals.css`. Un solo archivo de tema, sin tocar reglas existentes.
- **No:** `app/home.css` aparte. Rompe la convención de un único archivo de tema.
- **Sí:** datos mock tipados en `lib/data.ts` con textos literales. Mismo criterio que SPEC 01.
- **No:** derivar actividad/top desde `seededScores`. Cambiaría nombres y contenido del diseño.
- **Sí:** server components por defecto; solo `Reveal` es client por usar `IntersectionObserver`.
- **No:** `useReveal` global con `querySelectorAll` como en el prototipo. No es idiomático en React y no se limpia por componente.

## Riesgos identificados

| Riesgo | Mitigación |
| ------ | ---------- |
| Next 16.3.7 tiene cambios incompatibles (ver `AGENTS.md`); `node_modules/next/dist/docs/` no existe | Verificar firmas de `metadata`, `Link` y `usePathname` en los tipos de `node_modules/next` |
| Contenido `.reveal` invisible si el observer no corre (JS deshabilitado, SSR) | Aceptado para el MVP; con `IntersectionObserver` ausente se muestra de inmediato |
| Links de SPEC 01 que apuntan a `/` quedan en la landing | Listados en el paso 2; buscar con grep `href="/"` antes de cerrar |
| Bloques CSS copiados incompletos (reglas responsive dispersas) | Comparar con `styles.css` buscando cada clase `home-*`, `feature-*`, `mini-*`, `stat-*`, `activity-*`, `tick-*`, `top-*`, `price-*`, `pc-*`, `faq-*`, `final-*` |
| `toLocaleString("es-ES")` distinto servidor/cliente | Mismo locale explícito en ambos; datos fijos |

## Qué **no** está en esta spec

- Página "Acerca de" ni su link en el navbar.
- Datos reales o dinámicos en actividad, ranking y stats.
- Registro, pagos o créditos funcionales.
- Variantes de tema y estilos de gamepad del prototipo.
- Renombrar o migrar `/juegos/[id]` a `/games/[id]`.
- Tests automatizados.

Cada punto, si se aborda, va en su propia spec.
