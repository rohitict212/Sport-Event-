# Security plan

## Core principles

Security for SportEvent must be built from the beginning. A SaaS with tenant data must treat isolation and access control as a core requirement, not a UI convenience.

## Authentication and session handling

- Use a maintained authentication library such as NextAuth.js.
- Store only session-safe values in the browser.
- Keep secrets in environment variables, never in frontend code.
- Use secure password hashing and session tokens managed by the auth library.
- Use HTTPS in production.

## Authorization and multi-tenancy

- Every private request must be validated by the server.
- Every database query for organization-scoped data must filter by `organization_id`.
- Frontend-only hiding of buttons is not enough.
- URL parameters like `organizationId`, `tournamentId`, or `matchId` must not be trusted.
- Test unauthorized requests by changing IDs in API calls.

## Database safety

- Use Prisma or parameterized queries.
- Never create raw SQL string concatenation for user-controlled values.
- Add foreign keys, indexes, and unique constraints.
- Validate all request payloads with Zod or a similar library.

## Common web protections

- Validate and sanitize all input.
- Apply rate limiting to high-risk endpoints.
- Use secure HTTP headers.
- Protect against CSRF for state-changing requests that need it.
- Return minimal but useful error messages.

## Secret handling

- Put secrets in `.env.local` for local development and environment secrets in hosting.
- Use `.env.example` only as a placeholder template.
- Never commit `.env`, private keys, or production credentials.
- Do not expose secrets in logs or GitHub Actions output.

## Audit and monitoring

- Log important actions like login, tournament creation, score updates, and result finalization.
- Store enough metadata to support an audit trail without over-collecting personal data.
- Review logs for suspicious activity.

## Data minimization and retention

- Collect only what the product needs.
- Delete or archive data according to a documented retention policy.
- Keep backups and recovery procedures separate from production usage.

## Production risks to document

- Auth provider misconfiguration
- Missing tenant checks in a hidden API route
- Overly broad database access
- Weak environment-variable handling
- Insufficient audit logging

## Security validation steps

- Test a user with mismatched organization IDs.
- Test a scorer trying to modify unauthorized tournaments.
- Test invalid inputs such as negative overs or impossible score totals.
- Review logs after changes.

This is a planning document. The actual implementation must be verified with tests, not assumed to be secure because it looks correct.
