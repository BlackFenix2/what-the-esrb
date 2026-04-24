# AGENTS.md

## Purpose

This repository is a Next.js trivia game where users guess a game title from ESRB rating metadata sourced from IGDB.

Primary goals for agent changes:

- Keep gameplay stable and responsive.
- Preserve server-only handling of Twitch/IGDB credentials.
- Maintain strict TypeScript typing for API and UI state.

## Tech Stack

- Next.js App Router (v16)
- React (v19)
- TypeScript
- Tailwind CSS

## API Reference

- IGDB API docs: https://api-docs.igdb.com/

## Important Paths

- `src/app/page.tsx`: App entry, Suspense boundary, and initial game loading.
- `src/components/TriviaGame.tsx`: Main client gameplay loop and UI state.
- `src/components/EsrbBadge.tsx`: ESRB badge rendering.
- `src/app/actions/index.ts`: Server actions used by the UI.
- `src/app/api/game/route.ts`: Random game endpoint.
- `src/app/api/search/route.ts`: Search/autocomplete endpoint.
- `src/lib/igdb.ts`: Twitch token + IGDB API logic and parsing.
- `src/types/igdb.ts`: Shared API/domain types.

## Environment Variables

Required in `.env.local`:

- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`

Rules:

- Never hardcode secrets.
- Never expose secret values in client components.
- Keep credential usage in server-side modules (`src/lib/igdb.ts`, route handlers, server actions).

## Coding Guidelines

- Follow existing TypeScript style and keep explicit return types on exported functions.
- Reuse types in `src/types/igdb.ts` instead of duplicating interfaces.
- Prefer small, focused changes over broad refactors.
- Preserve current API shapes unless a request explicitly requires changes.
- Keep UI behavior predictable: guessing, reveal, scoring, and history should remain consistent.

## Data and API Behavior

- IGDB queries are written in IGDB query language strings inside `src/lib/igdb.ts`.
- Token caching is module-level; do not move token logic into client code.
- When changing query fields, update both parser logic and TypeScript types together.
- Keep graceful error handling in route handlers (`Response.json(..., { status })`).

## UX Constraints

- Maintain keyboard-friendly guessing flow (`Enter`, `Escape`, focus behavior).
- Keep loading and empty/error states visible and actionable.
- Avoid introducing blocking UI states during async transitions.

## Validation Checklist

Before finalizing changes:

1. Run `npm run lint`.
2. Run `npm run build` for significant runtime or typing changes.
3. Verify local gameplay manually:
   - Initial game loads.
   - Search suggestions appear.
   - Correct/incorrect/skip paths update score.
   - Next game transitions correctly.

## Change Boundaries

- Do not add new dependencies unless necessary for the task.
- Do not rewrite styling system or app architecture unless explicitly requested.
- Do not alter licensing, attribution text, or external branding without request.
