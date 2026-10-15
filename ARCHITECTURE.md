# Architecture

## High-level design

SportEvent will use a simple web application architecture based on Next.js. The app will handle both the UI and the server-side logic in one codebase, which keeps deployment and maintenance simpler for a small SaaS.

### Layers

1. Client layer: pages and UI components
2. Server layer: API routes, data access, auth checks
3. Business logic layer: tournament and scoring rules
4. Data layer: PostgreSQL with Prisma
5. Platform and deployment layer: GitHub Actions + Vercel or a similar managed host

## Why this architecture

- A single Next.js app is easier for a beginner to understand.
- Server-side API routes are enough for the MVP.
- PostgreSQL handles relational data and tenant boundaries cleanly.
- Prisma keeps database access predictable and reduces error-prone SQL.
- Managed hosting reduces operational effort.

## Recommended technology stack

- Frontend: Next.js, React, TypeScript
- Styling: Tailwind CSS
- Backend: Next.js server routes and API endpoints
- Auth: NextAuth.js or a maintained alternative
- Validation: Zod
- Database: PostgreSQL
- ORM: Prisma
- Testing: Vitest + Playwright
- CI: GitHub Actions
- Hosting: Vercel for frontend and server, managed Postgres outside the browser

## Folder structure proposal

```text
.
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── (public)/
│   ├── api/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── dashboard/
│   ├── public/
│   └── ui/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── permissions/
│   ├── scoring/
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── types/
├── validations/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .gitignore
├── README.md
├── PRODUCT.md
├── ARCHITECTURE.md
├── DATABASE.md
├── SECURITY.md
├── ROADMAP.md
├── CONTRIBUTING.md
├── DEPLOYMENT.md
├── TESTING.md
├── .github/
│   ├── copilot-instructions.md
│   └── workflows/
│       └── ci.yml
└── package.json
```

## Tenant-isolation approach

- Every private table must include `organization_id`.
- All authorization checks must happen on the server.
- Database foreign keys enforce ownership rules.
- Queries must always filter by both user and organization.
- Do not trust frontend state or URL parameters alone.
- Use row-level access patterns and server-side permission checks.

## Scoring domain design

The scoring engine should be separate from the UI. It should expose a clear domain model with actions like:

- create innings
- record runs
- record extras
- record wicket
- advance striker/non-striker
- complete over
- mark innings complete
- finalize match result

This keeps scoring rules testable and auditable.

## Risks and assumptions

- Cricket live scoring has edge cases and should be implemented carefully.
- We should not claim professional scoring compliance without real-world validation.
- The MVP should focus on accurate and auditable event-driven scoring rather than full broadcast-grade precision.
- This project is intentionally scoped to a small league and not a large tournament-management platform.

## Decision summary

The architecture is intentionally simple and affordable. It matches the product scope and avoids unnecessary complexity.
