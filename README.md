# SportEvent

Organize local cricket tournaments with less admin work. Manage teams, players, schedules, results, and public tournament pages from one simple dashboard.

**Live demo:** https://sport-event-one.vercel.app

**Interactive sample workspace:** https://sport-event-one.vercel.app/demo

> The live site is a non-commercial demo with fictional data. Changes stay in your browser. Sign-in, SMS verification, and saved tournaments are not part of the live demo.

SportEvent is a tournament management SaaS for local cricket organizers. The full application supports organization setup, tournament management, team and player records, match scheduling, innings scoring, result tracking, and public tournament standings and results pages.

## Current product status

This repository holds two things: the interactive demo that is live today, and the full application that is built in the code but not yet open to real users.

| Part | Status |
| --- | --- |
| Landing page (`/`) | Live on Vercel |
| Interactive demo (`/demo`) | Live on Vercel, browser-only, fictional data |
| Mobile OTP sign-in, organizations, saved tournaments, public tournament pages | Built in the code, not live. Needs a production PostgreSQL database and Twilio Verify |
| Commercial use with real customers | Not open yet. Complete the checklist in "Before commercial launch" first |

### Live demo features

The demo at `/demo` is a sample workspace. Use **Reset sample** to restore the original sample data.

- Several fictional tournaments, each with its own teams, players, matches, batting and bowling scorecards, statistics, and standings
- Create, edit, and delete tournaments, fixtures, and player records
- Clear an individual player's statistics separately
- Over-by-over cumulative-run comparison charts
- Personal player cards
- Run rates, batting averages, strike rates, and bowling economy

All demo data is stored only in the visitor's browser. Nothing is sent to a database. Do not enter real personal or tournament data.

### Demo limits

- No login and no SMS
- No real organizer dashboards or public tournament pages
- All API routes are disabled
- Data resets or disappears if the visitor clears browser storage or switches browser or device

### Full application features (in the code, not live)

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

Management in the full application requires a verified mobile number. OTP delivery is handled by Twilio Verify, and authenticated users can only access organizations where they are members. Tournament results stay private unless an organizer publishes them.

## Stack

- Next.js App Router and React
- TypeScript and ESLint
- Tailwind CSS
- Prisma with PostgreSQL
- Zod validation and Vitest
- Hosted on Vercel (Hobby plan, non-commercial demo)

## Getting started

```bash
npm install
```

To run the demo locally without a database or Twilio, add this line to `.env.local` and start the app:

```bash
NEXT_PUBLIC_DEMO_MODE=static
```

To run the full application locally, copy `.env.example` to `.env.local` and configure PostgreSQL plus Twilio Verify credentials, then run:

```bash
npm run prisma:generate
npm run dev
```

The app opens at the local address shown in the terminal, for example http://localhost:3033. The public version is at https://sport-event-one.vercel.app.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run ci:check
```

## Key app routes

| Route | Purpose | Live today |
| --- | --- | --- |
| `/` | Landing page | Yes |
| `/demo` | Interactive sample workspace | Yes |
| `/dashboard` | Organizations overview | Full app only |
| `/dashboard/tournaments` | Tournament list and standings link | Full app only |
| `/dashboard/teams` | Team management | Full app only |
| `/dashboard/players` | Player management | Full app only |
| `/dashboard/matches` | Match scheduling | Full app only |
| `/dashboard/scoring` | Live innings and delivery scoring | Full app only |
| `/tournaments/[id]` | Public tournament standings and results page | Full app only |

## Access and privacy

The live demo has no accounts. Everything a visitor enters stays in their browser.

In the full application, management routes and APIs require a verified mobile sign-in. Organization data is scoped to membership on the server. Public tournament pages return only tournaments explicitly published by an organization member.

Configure Twilio Verify for SMS with six-digit codes. There is no fixed development OTP or bypass. Without valid provider settings, verification fails closed.

## Deployment

### Current: non-commercial demo on Vercel

The live site runs in demo mode. In the Vercel project, `NEXT_PUBLIC_DEMO_MODE` is set to `static` for the Production environment. This mode keeps the landing page and the interactive sample workspace at `/demo`. Login, SMS, real organizer dashboards, tournament pages, and all API routes stay disabled. It needs no database or Twilio credentials.

The Vercel Hobby plan is for non-commercial use. Do not use this deployment to serve commercial customers or to handle real personal or tournament data.

To update the live site, push to the `main` branch. Vercel redeploys automatically.

### Future: full application

Switch to the full application only when the production database, Twilio Verify, HTTPS origin, and an appropriate hosting plan are ready and the full app has been revalidated. Then remove `NEXT_PUBLIC_DEMO_MODE`.

This repository includes a Vercel config at `vercel.json`. For a production deploy of the full application, configure these environment variables in Vercel:

- `DATABASE_URL` (managed production PostgreSQL)
- `NEXT_PUBLIC_APP_URL` (HTTPS production origin)
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`

Set production secrets only in the hosting provider. Environment values in `.env.example` are placeholders. Do not commit local credentials or secrets.

## Before commercial launch

The live demo does not need any of this. Before opening the full application to real users, confirm:

- production environment variables are set separately from local values
- `DATABASE_URL` points to a managed PostgreSQL instance
- Twilio Verify is configured in the hosting provider with a six-digit code and appropriate geography, rate, and spending limits
- `NEXT_PUBLIC_APP_URL` is the HTTPS production origin
- HTTPS session cookies are enabled
- unauthenticated API access and cross-organization access are rejected
- unpublished tournaments are not publicly accessible
- CI passes in GitHub Actions
- backups and rollback steps are documented
- the public tournament page is reviewed for privacy and correctness
- the Vercel project uses the same variables as the production environment
- the hosting plan allows commercial use
