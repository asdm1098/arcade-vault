# SPEC 03 — Página "Acerca de" con formulario de contacto (Resend)

> **Status:** Aprobado
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-10-02
> **Objective:** Agregar la página `/acerca-de` (misión + formulario de contacto) tal cual `references/templates/home-about/about.jsx`, con su link en el navbar y envío real del mensaje por correo usando Resend.

---

## Por qué existe esta spec

SPEC 02 dejó fuera "Acerca de" y su link en el navbar. El prototipo `about.jsx` es la fuente de verdad del diseño: no se rediseña nada. El prototipo solo simula el envío (`setSent(...)`); aquí el envío es real vía Resend con una Server Action.

## Alcance

**Dentro:**

- Nueva ruta `/acerca-de` portada de `about.jsx`: hero "ACERCA DE ARCADE VAULT", 3 highlights con icono (HEART, BROWSER, PLANT), divisor de píxeles y sección "CONTÁCTANOS" con tips y formulario.
- Textos, clases CSS, iconos SVG, `transitionDelay` de los highlights, animación `.reveal` y animación `shake` idénticos al prototipo.
- Link "Acerca de" en el navbar (desktop) y en el panel móvil, activo en `/acerca-de`.
- Copiar a `app/globals.css` el bloque `/* ===== ABOUT PAGE ===== */` de `references/templates/home-about/styles.css` (más reglas responsive y estilos de `textarea`/`.shake` que falten).
- Envío del formulario con Server Action y el SDK `resend`.
- Variables de entorno `RESEND_API_KEY`, `RESEND_FROM_EMAIL` y `CONTACT_TO_EMAIL` en `.env.local`, y plantilla `.env.example`.
- Estado de error inline cuando el envío falla (extensión mínima del prototipo, que solo define validación de campos vacíos).

**Fuera de alcance (specs futuras):**

- Guardar mensajes en base de datos o historial.
- Correo de confirmación al usuario que escribe.
- Rate limiting, CAPTCHA o honeypot anti-spam.
- Plantillas de correo HTML con React Email (el correo es texto plano).
- Link a "Acerca de" en el footer.
- Variantes de tema y estilos `GAMEPAD` del prototipo.
- Tests automatizados.

## Modelo de datos

Se agregan tipos a `lib/types.ts`:

```ts
export interface ContactInput {
  name: string;
  email: string;
  msg: string;
}

export type ContactResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "send_failed" };
```

Variables de entorno (solo servidor, sin prefijo `NEXT_PUBLIC_`):

```
RESEND_API_KEY=       # API key de Resend
RESEND_FROM_EMAIL=    # remitente, p. ej. "Arcade Vault <onboarding@resend.dev>" en pruebas
CONTACT_TO_EMAIL=     # destinatario que recibe los mensajes
```

Convenciones:

- Textos de UI en español, idénticos al prototipo.
- El correo se envía con `replyTo` = email del usuario, `subject` = `Contacto Arcade Vault — <nombre>` y cuerpo en texto plano con nombre, email y mensaje.
- Esta spec no introduce persistencia ni claves nuevas en `localStorage`.

## Plan de implementación

1. Instalar `resend` con `pnpm add resend`. Crear `.env.example` con las 3 variables vacías. Verificar `.env*` en `.gitignore` (ya ignora `.env*`; `.env.example` se agrega con `git add -f` o excepción `!.env.example`). Verificar con `pnpm build`.
2. Copiar a `app/globals.css` el bloque `/* ===== ABOUT PAGE ===== */` y sus reglas responsive desde `styles.css`; añadir `textarea` y `.shake` si no están cubiertos. No tocar reglas existentes. Verificar con `pnpm build`.
3. Agregar `ContactInput` y `ContactResult` a `lib/types.ts`.
4. Crear `app/acerca-de/actions.ts` (`"use server"`) con `sendContact(input: ContactInput): Promise<ContactResult>`: valida (los 3 campos no vacíos tras `trim`, email con formato válido, mensaje ≤ 2000 caracteres), envía con `Resend`, y devuelve `{ ok: false, error }` sin lanzar excepciones. Si falta alguna variable de entorno devuelve `send_failed`.
5. Crear `components/about/highlight-icon.tsx` (server) con los 3 SVG de `HighlightIcon`.
6. Crear `components/about/contact-form.tsx` (`"use client"`) con el formulario del prototipo: estado `form`, `sent`, `shake`; validación local de vacíos con `shake` (400 ms); al enviar llama `sendContact`, bloquea el botón mientras espera ("▶  ENVIANDO…"), y solo al recibir `{ ok: true }` muestra el `terminal-success` del prototipo. En `send_failed` mantiene los datos y muestra un mensaje de error inline.
7. Crear `app/acerca-de/page.tsx` (server) con hero, highlights, divisor y sección de contacto, envolviendo en `Reveal` (de SPEC 02) lo que en el prototipo lleva `.reveal`. `metadata.title` = "Acerca de". Verificar la ruta en `pnpm dev`.
8. Actualizar `components/nav.tsx`: link "Acerca de" a `/acerca-de` (activo con `pathname.startsWith("/acerca-de")`) en la barra y en el panel móvil, después de "Salón de la Fama".
9. Probar el envío real con una API key de Resend y revisar visualmente `/acerca-de` contra `references/templates/home-about/arcade-vault-standalone.html` en desktop y móvil (screenshots en `.playwright-screenshots/`).

## Criterios de aceptación

- [ ] `pnpm lint` termina sin errores.
- [ ] `pnpm build` termina sin errores.
- [ ] `/acerca-de` muestra el kicker "▸ ACERCA DE", el título "ACERCA DE ARCADE VAULT" y el texto de misión del prototipo.
- [ ] Se muestran 3 highlights: "HECHO CON ❤️ PARA JUGADORES", "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR", "PROYECTO EN CONSTANTE CRECIMIENTO".
- [ ] Se muestra el divisor con 24 píxeles animados y la sección "CONTÁCTANOS" con 3 tips (RESPUESTA EN 24-48H, SUGERENCIAS BIENVENIDAS, SIN SPAM, JAMÁS).
- [ ] El navbar muestra Inicio, Biblioteca, Salón de la Fama, Acerca de; "Acerca de" activo solo en `/acerca-de`.
- [ ] El panel móvil incluye "Acerca de" y cierra al hacer clic.
- [ ] Enviar con algún campo vacío (o solo espacios) activa `shake` durante 400 ms y no llama a `sendContact`.
- [ ] Enviar con email de formato inválido no envía correo y muestra el mismo estado de rechazo que un campo vacío.
- [ ] Enviar datos válidos con credenciales correctas entrega un correo al `CONTACT_TO_EMAIL` con asunto `Contacto Arcade Vault — <nombre>`, `Reply-To` igual al email del usuario y el mensaje en el cuerpo.
- [ ] Tras el envío exitoso aparece el `terminal-success` con "MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, <NOMBRE EN MAYÚSCULAS>."
- [ ] "ENVIAR OTRO MENSAJE" vuelve al formulario con los campos vacíos.
- [ ] Con `RESEND_API_KEY` ausente o inválida, el formulario conserva los datos, muestra un error inline y no muestra el terminal de éxito.
- [ ] El botón de envío queda deshabilitado mientras la petición está en curso.
- [ ] `RESEND_API_KEY` no aparece en el bundle del cliente (búsqueda en `.next/static` sin coincidencias).
- [ ] En ancho ≤ 768 px `/acerca-de` no tiene scroll horizontal.
- [ ] No hay errores de hidratación en la consola de `/acerca-de`.
- [ ] Solo `components/about/contact-form.tsx` (y los `"use client"` ya existentes) llevan `"use client"`; `app/acerca-de/page.tsx` es server component.

## Decisiones tomadas y descartadas

- **Sí:** Server Action para el envío. Sin ruta API extra y la API key nunca llega al cliente. Decisión del usuario.
- **No:** Route Handler `app/api/contact/route.ts`. Solo valdría con clientes externos, que no hay.
- **Sí:** ruta `/acerca-de`. Coherente con `/juegos` y `/salon` (rutas en español). Decisión del usuario.
- **No:** `/about`. Mezclaría inglés con las rutas de detalle y salón.
- **Sí:** remitente y destinatario en variables de entorno. Cambian entre desarrollo y producción y no deben ir en el repo. Decisión del usuario.
- **No:** destinatario hardcodeado en el código.
- **Sí:** mostrar el terminal de éxito solo tras confirmación de Resend, con error inline si falla. Mentir al usuario sobre un mensaje no entregado es peor que mostrar el error. Decisión del usuario.
- **No:** siempre mostrar éxito (como el prototipo simulado).
- **Sí:** validar de nuevo en el servidor. El cliente puede saltarse la validación local.
- **Sí:** correo en texto plano. Es lo mínimo útil para un buzón interno.
- **No:** React Email ni plantillas HTML. Complejidad sin beneficio para un mensaje de contacto.
- **Sí:** seguir el prototipo exactamente en markup, clases y textos. Instrucción del usuario.
- **Sí:** `contact-form.tsx` como único componente client; hero, highlights e iconos son server. Mismo criterio que SPEC 02.
- **No:** `useReveal` global con `querySelectorAll` del prototipo. Se reutiliza `Reveal` de SPEC 02.

## Riesgos identificados

| Riesgo | Mitigación |
| ------ | ---------- |
| Next 16.3.7 con cambios incompatibles (ver `AGENTS.md`); `node_modules/next/dist/docs/` no existe | Verificar el soporte de `"use server"` y la firma de `metadata` en los tipos de `node_modules/next` |
| En modo prueba, Resend solo permite enviar desde `onboarding@resend.dev` y solo al correo del dueño de la cuenta | Documentarlo en `.env.example`; para otro destinatario hay que verificar un dominio en Resend |
| API key faltante en el entorno de despliegue | La acción devuelve `send_failed` sin romper la página; el error se ve inline |
| Spam al formulario sin rate limiting | Aceptado para el MVP; queda fuera de alcance (ver arriba) |
| Bloque CSS copiado incompleto (reglas responsive dispersas) | Comparar con `styles.css` buscando cada clase `about-*`, `highlight*`, `hl-*`, `contact-*`, `tip*`, `terminal-*`, `term-*`, `shake` |
| `.env.local` con la API key subido al repo por error | `.gitignore` ya ignora `.env*`; solo se versiona `.env.example` sin valores |

## Qué **no** está en esta spec

- Persistencia de mensajes en base de datos.
- Correo de confirmación al remitente.
- Rate limiting, CAPTCHA o honeypot.
- Plantillas HTML de correo (React Email).
- Link a "Acerca de" en el footer.
- Variantes de tema y estilos de gamepad del prototipo.
- Tests automatizados.

Cada punto, si se aborda, va en su propia spec.
