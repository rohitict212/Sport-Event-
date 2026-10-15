# SportEvent repository instructions

## Product purpose

SportEvent is a small SaaS for local cricket tournaments. The product helps organizers create and run tournaments, manage teams and players, schedule matches, record live scoring, and publish a public results page.

## Project status

This repository is currently in the architecture and documentation preparation phase. Do not implement a full application foundation without approval. Focus on project setup, documentation, configuration, and architecture decisions.

## Coding conventions

- Prefer clear, simple, maintainable code.
- Use TypeScript for application code.
- Keep logic separated from UI where possible.
- Favor explicit permission checks over hidden UI behavior.
- Use Prisma and PostgreSQL for data modeling.
- Validate input with Zod or equivalent.
- Keep the architecture simple and affordable.

## Security rules

- Never trust user input or client-provided IDs.
- Always enforce authorization on the server.
- Tie all private data to `organization_id`.
- Never expose secrets or credentials in code.
- Never commit `.env` files or production secrets.
- Keep audit logs for important actions.

## Tenant-isolation rules

- Organization-scoped queries must include the correct organization filter.
- A user should never read or modify another organization’s data.
- Authorization must be enforced server-side.
- Frontend hiding alone is not a valid security control.

## Testing requirements

- Validate all critical flows with unit, integration, and end-to-end tests.
- Test unauthorized access, scoring edge cases, and points-table logic.
- Ensure the critical organizer journey is covered before release.

## Documentation requirements

- Keep README and planning docs synchronized with implementation changes.
- Update architecture and security notes when the code changes.
- Keep the product scope simple and aligned to the MVP.

## Operational guidance

- Do not deploy or push to GitHub without approval.
- Do not create paid cloud infrastructure without explicit approval.
- Prefer managed services and low-complexity infrastructure.
- Document any unresolved risks and assumptions.
