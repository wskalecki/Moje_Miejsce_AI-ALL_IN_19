# Application

React 19 + TypeScript + Vite, with [@supabase/supabase-js](https://supabase.com/docs/reference/javascript/introduction).

## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Supabase

1. Copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Import the client from `src/lib/supabase.ts`.

Full team setup: [`../docs/setup/README.md`](../docs/setup/README.md).
