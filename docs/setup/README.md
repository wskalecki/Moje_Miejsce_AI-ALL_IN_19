# Setup

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm
- Supabase project ([supabase.com](https://supabase.com)) — create one for hackathon dev

## Application (React)

```bash
cd application
cp .env.example .env
# Edit .env with your Supabase URL and anon key
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Project URL from Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `anon` / public key (safe in the browser with RLS) |

Never commit `.env`. Use Row Level Security and policies in Supabase for production-minded setups.

## Data

The **data** developer adds datasets under [`../../data/`](../../data/). Document filenames, sources, and refresh steps in `data/README.md`.

## Presentation assets

Place demo 3D models in [`../../presentation/models/`](../../presentation/models/) and slide/visual assets in [`../../presentation/graphics/`](../../presentation/graphics/). Prefer Git LFS for large binaries.
