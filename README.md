# Warsaw Open Data Hackathon — project template

Monorepo layout for the team hackathon build.

| Folder | Purpose |
|--------|---------|
| [`application/`](application/) | React (Vite + TypeScript) frontend with Supabase |
| [`docs/`](docs/) | Project documentation — notes, core decisions, setup |
| [`data/`](data/) | Datasets and exports (owned by the data developer) |
| [`presentation/`](presentation/) | 3D models and graphics for demos and slides |

Legacy idea docs from Mati live in [`pomysly-mati/`](pomysly-mati/).

## Quick start

1. Read [`docs/setup/README.md`](docs/setup/README.md).
2. Configure Supabase in `application/.env` (see `application/.env.example`).
3. From `application/`: `npm install` → `npm run dev`.
