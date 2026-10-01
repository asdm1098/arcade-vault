# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault: online game platform, compete for highest score. Early stage — still the Create Next App scaffold (`app/layout.tsx`, `app/page.tsx`). README says project follows spec-driven development (`/spec`, `/spec-impl` skills from `Klerith/fernando-skills`, installed via `npx skills@latest add Klerith/fernando-skills`). README is in Spanish.

## Commands

Package manager: pnpm.

- `pnpm dev` — dev server
- `pnpm build` / `pnpm start` — production build / serve
- `pnpm lint` — ESLint (flat config, `eslint.config.mjs`)

No test runner configured.

## Skills
Usa siempre /frontend-design para diseñar la interfaz de usuario.

## Stack

Next.js 16.3.7 (App Router, `app/` at repo root, no `src/`), React 19, TypeScript, Tailwind CSS v4 (via `@tailwindcss/postcss`, styles in `app/globals.css`). Path alias `@/*` → repo root.

Next version has breaking changes vs. training data (see AGENTS.md). Note: `node_modules/next/dist/docs/` does not exist in the installed package — verify APIs against installed `next` source/types instead.

