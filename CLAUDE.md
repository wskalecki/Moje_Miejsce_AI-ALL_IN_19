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
| `data/` | Datasets and ETL |
| `presentation/` | Demo graphics and 3D |

## Product context

Hackathon W3 — Warsaw open data; map of ~1 km cells to help choose where to live. See `docs/core/koncept-aplikacji.md`.

## Do not

- Commit `.env` or API tokens
- Force-push `master`
- Amend pushed commits unless explicitly requested

Cursor-specific rules live in `.cursor/rules/`.
