# Contributing

## Local setup

1. Install Node.js 20 or later.
2. Clone the repository.
3. Create a local branch.
4. Copy `.env.example` to `.env.local` and replace placeholder values.
5. Install dependencies with your package manager.

## Development workflow

- Keep changes small and reviewable.
- Work in feature branches.
- Update documentation when behavior changes.
- Do not add dependencies without explaining the reason.
- Never hide security issues or skip required validation.

## Branching

Use a simple branch model:

- `main` — stable branch
- `feature/...` — work for an enhancement
- `fix/...` — bug fixes

## Commit message guidance

Use clear, factual commit messages such as:

- `feat: add organization creation flow`
- `fix: enforce tenant check on match API`
- `docs: add security checklist`

## Pull request checklist

Before creating a pull request, confirm:

- Linting passes
- Type checking passes
- Tests pass
- Security-sensitive changes are reviewed
- Documentation is updated
- No secrets are included in code or logs

## Quality gates

The project should enforce:

- linting
- TypeScript checks
- unit and integration tests
- end-to-end critical journeys
- production build validation

This repository is intentionally scoped for careful, reviewable implementation during the MVP preparation phase.
