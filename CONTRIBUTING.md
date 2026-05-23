# Contributing to Dr. Dose

Thank you for your interest in contributing. This project is in active development for personal and family use; these guidelines help keep changes safe and reviewable.

## Who this is for

Dr. Dose is **not** a regulated medical device. Contributors should preserve clear disclaimers: the app helps people **organize** medications and **log** experiences to discuss with clinicians — it does not diagnose or prescribe.

## Getting started

1. Fork the repository and clone your fork (or work on a branch if you are a collaborator).
2. Create a branch from `main` (`feature/…`, `fix/…`, or `docs/…`).
3. Follow [README.md](README.md) and [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) to run the web app locally (`cd web && npm install && npm run dev`).
4. Install git hooks so the README **Development log** updates on each commit: `./scripts/install-githooks.sh`
5. Open a pull request against `main` with a clear description and test plan.

## Pull requests

- Keep changes focused; prefer smaller PRs over large mixed ones.
- Update `docs/` when behavior or setup changes. The README **Development log** is appended automatically by the post-commit hook (or run `./scripts/append-dev-log.sh` manually).
- Run `npm run lint` and `npm run build` in `web/` before opening a PR (CI runs the same checks).
- Do not commit secrets (`web/.env`, Supabase `service_role` key).

## Commit messages

Use clear, imperative subjects:

- `Add wellness daily log to Today page`
- `Fix reminder timezone comparison`
- `Update README setup instructions`

## Code style

- TypeScript + React in `web/src/`
- Match existing patterns (hooks, `lib/` for logic, components for UI)
- ESLint is enabled — fix lint errors before pushing

## Reporting issues

Use the GitHub issue templates for bugs and feature requests. Include steps to reproduce, expected vs actual behavior, browser/OS, and whether you use local dev or the Vercel URL.

## Medical & safety copy

User-facing text must not imply diagnosis, guaranteed interaction coverage, or treatment advice. Wellness and interaction features are **educational / self-tracking** only.

## Questions

Open a GitHub Discussion or issue if something is unclear. For security issues, see [SECURITY.md](SECURITY.md) — do not file public issues for vulnerabilities.
