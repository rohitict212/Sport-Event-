# Security notes

## Core principles

Security for SportEvent must be built from the beginning. A SaaS with tenant data must treat isolation and access control as a core requirement, not a UI convenience.

## Authentication and session handling

- Sign-in uses Twilio Verify SMS OTP with E.164 phone numbers and six-digit codes.
- The browser receives an HTTP-only, SameSite=Lax session cookie; only a SHA-256 hash of the random session token is stored in the database.
- OTP codes are checked by Twilio and are never persisted by this app.
- OTP endpoints enforce persistent per-phone and per-client-address rate limits.
- State-changing endpoints require same-origin requests.
- Session cookies are Secure in production; production must use HTTPS.
- There is no development OTP bypass. Missing provider configuration fails closed.

## Authorization and multi-tenancy

- Every private request must be validated by the server.
- Every database query for organization-scoped data must filter by `organization_id`.
- Dashboard pages and management APIs require a session and organization membership.
- Tournament pages are private by default and require an organization member to publish them.
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
- Apply persistent rate limits to OTP endpoints.
- Set frame, MIME-sniffing, referrer, permissions, and production HSTS headers.
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
- SMS provider misconfiguration or unbounded spend

## Security validation steps

- Test a user with mismatched organization IDs.
- Test a scorer trying to modify unauthorized tournaments.
- Test invalid inputs such as negative overs or impossible score totals.
- Review logs after changes.

Production launch is blocked until real Twilio Verify credentials, managed production PostgreSQL, an HTTPS app origin, backups, and hosting access are configured. Never put secrets in this repository or in chat.
