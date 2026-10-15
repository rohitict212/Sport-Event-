# SportEvent

SportEvent is a tournament management SaaS for local cricket organizers. The app supports organization setup, tournament management, team and player records, match scheduling, innings scoring, result tracking, and public tournament standings and results pages.

## Current product status

This is a working MVP ready for a staging or closed-release preview. It is not yet publicly deployed.

### Included features

- Organizer authentication and session management
- Organization creation and member-scoped access
- Tournament management
- Team and player management
- Match scheduling and status tracking
- Innings creation and score-event recording
- Final match result calculation
- Public tournament standings and results page
- Protected dashboard routes with organization-level access checks

## Stack

- Next.js App Router and React
- TypeScript and ESLint
- Tailwind CSS
- Prisma with PostgreSQL
- Zod validation and Vitest

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app can be viewed at http://localhost:3000.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run ci:check
```

## Key app routes

- `/` — landing page
- `/signup` — account creation
- `/login` — sign in
- `/dashboard` — organizations overview
- `/dashboard/tournaments` — tournament list and standings link
- `/dashboard/teams` — team management
- `/dashboard/players` — player management
- `/dashboard/matches` — match scheduling
- `/dashboard/scoring` — live innings and delivery scoring
- `/tournaments/[id]` — public tournament standings and results page

## Production readiness before public launch

Before making the product public, confirm:

- production environment variables are set separately from local values
- DATABASE_URL points to a managed PostgreSQL instance
- NEXTAUTH_SECRET and app URL are production-safe
- CI passes in GitHub Actions
- admin and organizer access rules are tested
- backups and rollback steps are documented
- the public tournament page is reviewed for privacy and correctness
- the Vercel project is configured with the same variables as the production environment

Environment values are placeholders in `.env.example`. Do not commit local credentials or secrets.

## Vercel deployment notes

This repository includes a Vercel config at `vercel.json`. For a production deploy, configure the following environment variables in Vercel:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`

Use a production PostgreSQL connection string and a strong random value for `NEXTAUTH_SECRET`.
