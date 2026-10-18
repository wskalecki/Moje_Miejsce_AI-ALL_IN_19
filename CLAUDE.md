# Claude / AI agent — repo conventions

Follow these when changing this repository.

## Git workflow

- **Integration branch:** `master`
- **One branch per feature or fix** — never land features/fixes directly on `master`.
- Branch names: `feat/short-slug`, `fix/short-slug`, optionally `docs/short-slug`.
- Start from updated `master`, merge back to `master` when done (PR preferred).

## Commit messages

```
feat: short title
fix: short title
docs: short title
chore: short title
```

Use `feat` for new capability, `fix` for bugs. Keep the subject short and imperative.

## Project layout

| Path | Purpose |
|------|---------|
| `application/` | React (Vite) + Supabase |
| `docs/core/` | Product concept, decisions (`koncept-aplikacji.md`) |
| `docs/sources/` | Reference notes |
| `data/` | Datasets and ETL — see `docs/data/`, rule `.cursor/rules/data-developer.mdc` |
| `presentation/` | Demo graphics and 3D |

## Data knowledge base

- **Every committed data file, source, dataset and metric is registered in [`data/catalog.json`](data/catalog.json)** (readable view: [`docs/data/katalog-danych.md`](docs/data/katalog-danych.md)). When you add or change data, update the catalog, run `python3 data/scripts/data_catalog.py --render` and `python3 data/scripts/validate_data.py`. No scraped, synthetic or hand-tuned values; missing data is `null` with a reason.
- Before looking for data, read [`docs/data/zrodla-danych.md`](docs/data/zrodla-danych.md) (verified endpoints, API quirks, licences, decisions).
- When you verify a source, find a quirk or choose a dataset, **add it there** so other people and agents do not repeat the work.
- Metrics framework: [`docs/data/siatka-etl.md`](docs/data/siatka-etl.md).

## Product context

Hackathon W3 — Warsaw open data; map of 250 m cells (EPSG:2180, see `docs/data/grid-schema.md`) to help choose where to live. See `docs/core/koncept-aplikacji.md`.

## Do not

- Commit `.env` or API tokens
- Force-push `master`
- Amend pushed commits unless explicitly requested

Cursor-specific rules live in `.cursor/rules/`.
