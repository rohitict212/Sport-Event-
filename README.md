# SportEvent

SportEvent is a small SaaS for managing local cricket tournaments. It helps organizers create tournaments, add teams and players, schedule matches, record live scoring, calculate points, and share public results.

This repository is currently in the project-preparation phase. The goal for this stage is to define the product, architecture, database model, security rules, and implementation roadmap without building the full application foundation.

## What SportEvent will do

- Let an organizer create an account and organization.
- Create tournaments with teams and players.
- Schedule matches and record live cricket scoring.
- Update standings and publicly share results.
- Protect private data so each organization can only see its own records.

## Recommended stack

- Frontend: Next.js, React, TypeScript
- Styling: Tailwind CSS
- Backend: Next.js API routes and server logic
- Database: PostgreSQL
- ORM: Prisma
- Authentication: NextAuth.js or a maintained auth provider
- Validation: Zod
- Testing: Vitest + Playwright
- CI: GitHub Actions
- Hosting: Vercel or a similar managed platform

## Repository structure

- `README.md` — project overview
- `PRODUCT.md` — product scope, roles, and MVP decisions
- `ARCHITECTURE.md` — technical architecture and folder structure
- `DATABASE.md` — data model and relationships
- `SECURITY.md` — security and tenant-isolation plan
- `ROADMAP.md` — phased delivery plan
- `CONTRIBUTING.md` — contribution and quality workflow
- `DEPLOYMENT.md` — hosting and environment plan
- `TESTING.md` — testing strategy and critical journey
- `.github/copilot-instructions.md` — repo-specific AI guidance
- `.github/workflows/ci.yml` — CI template for lint, tests, and build

## Quick status

- Git repository: initialized on the local workspace.
- Full application build: not started yet.
- Remote GitHub push: not done.
- Paid infrastructure: not created.

## Important note

This repository is intentionally prepared for architecture and documentation, not a production-ready app. The next step is to confirm the architecture and then implement the application foundation only after approval.

## Day-1 setup after approval

```bash
git checkout -b main
npm install
npm run dev
```

Later, when the app foundation exists, use the project-specific scripts in the package manifest to run linting, type checking, tests, and production builds.
