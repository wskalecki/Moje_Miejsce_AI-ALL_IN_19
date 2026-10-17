# GitHub issues backlog

Issues are created with [`scripts/create_github_issues.sh`](../../scripts/create_github_issues.sh).

## Prerequisites

```bash
gh auth login
# or export GH_TOKEN with repo scope
```

## Create all issues

```bash
./scripts/create_github_issues.sh
```

## Labels

`epic`, `data`, `frontend`, `design`, `3d`, `chore`

## Manual template

Use **New issue → Hackathon task** in GitHub after this branch merges (`.github/ISSUE_TEMPLATE/hackathon-task.yml`).
