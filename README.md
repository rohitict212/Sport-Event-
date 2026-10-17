# SportEvent

SportEvent is a tournament management SaaS for local cricket organizers. The app supports organization setup, tournament management, team and player records, match scheduling, innings scoring, result tracking, and public tournament standings and results pages.

## Current product status

Management requires a verified mobile number. OTP delivery is handled by Twilio Verify, and authenticated users can only access organizations where they are members. Tournament results stay private unless an organizer publishes them.

### Included features

- E.164 mobile sign-in with six-digit SMS verification codes
- HTTP-only, database-backed sessions
- Server-side organization membership checks for management pages and APIs
- Persistent rate limits for OTP send and verify requests
- Organization creation for the signed-in user
- Private tournament pages by default with organizer-controlled publishing
- Tournament management
- Team and player management
- Match scheduling and status tracking
- Innings creation and score-event recording
- Final match result calculation
- Public tournament standings and results page

## Stack

- Next.js App Router and React
- TypeScript and ESLint
- Tailwind CSS
- Prisma with PostgreSQL
- Zod validation and Vitest

## Getting started

```bash
npm install
```

Copy `.env.example` to `.env.local` and configure PostgreSQL plus Twilio Verify credentials, then run:

```bash
npm run prisma:generate
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
- `/dashboard` — organizations overview
- `/dashboard/tournaments` — tournament list and standings link
- `/dashboard/teams` — team management
- `/dashboard/players` — player management
- `/dashboard/matches` — match scheduling
- `/dashboard/scoring` — live innings and delivery scoring
- `/tournaments/[id]` — public tournament standings and results page

## Access and privacy

Management routes and APIs require a verified mobile sign-in. Organization data is scoped to membership on the server. Public tournament pages return only tournaments explicitly published by an organization member.

Configure Twilio Verify for SMS with six-digit codes. There is no fixed development OTP or bypass. Without valid provider settings, verification fails closed.

## Before public deployment

Before making the product public, confirm:

- production environment variables are set separately from local values
- DATABASE_URL points to a managed PostgreSQL instance
- Twilio Verify is configured in the hosting provider with a six-digit code and appropriate geography, rate, and spending limits
- `NEXT_PUBLIC_APP_URL` is the HTTPS production origin
- HTTPS session cookies are enabled
- unauthenticated API access and cross-organization access are rejected
- unpublished tournaments are not publicly accessible
- CI passes in GitHub Actions
- backups and rollback steps are documented
- the public tournament page is reviewed for privacy and correctness
- the Vercel project is configured with the same variables as the production environment

Environment values are placeholders in `.env.example`. Do not commit local credentials or secrets.

## Vercel deployment notes

This repository includes a Vercel config at `vercel.json`. For a production deploy, configure the following environment variables in Vercel:

- `DATABASE_URL` (managed production PostgreSQL)
- `NEXT_PUBLIC_APP_URL` (HTTPS production origin)
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`

Set production secrets only in the hosting provider. Do not deploy until real provider credentials and the production database are configured and verified.

## Non-commercial static demo

To deploy a read-only, non-commercial preview on the Vercel Hobby plan, set
`NEXT_PUBLIC_DEMO_MODE=static` for the Production environment. This mode keeps the
landing page available but disables login, SMS, organizer dashboards, tournament
pages, and all API routes. It does not require database or Twilio credentials and
must not be used to serve commercial customers. Remove the variable only when the
production database, Twilio Verify, HTTPS origin, and an appropriate hosting plan
are ready and the full app has been revalidated.
