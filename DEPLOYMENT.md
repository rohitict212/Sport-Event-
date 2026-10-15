# Deployment plan

## Basic deployment strategy

The most practical low-complexity production model for this project is:

- Frontend and server app hosted by Vercel or a similar managed platform
- PostgreSQL database hosted in a managed provider
- GitHub for source control and CI
- Environment variables managed by the host
- HTTPS enabled by default

## Why this setup

This approach reduces operational work while still being production-ready for a small SaaS. It is simpler than running custom infrastructure, containers, or multiple backend services.

## Environment separation

- Development: local machine or a dev deployment
- Production: separate database and credentials
- Never reuse local credentials in production

## Required settings

The application should use environment variables for:

- database connection string
- auth secret
- app URL
- provider credentials
- deployment environment value

## Database deployment

- Use a managed PostgreSQL service.
- Use migrations to keep schema changes consistent.
- Create backups based on the provider schedule.
- Keep production database credentials separate from development credentials.

## Health checks and release flow

- Run health checks after deployment.
- Validate login, organization creation, and public tournament pages.
- Check database connectivity and migration status.
- Keep rollback instructions documented.

## Backup and recovery

- Use provider-backed database backups.
- Retain backup history according to risk and cost tolerance.
- Document how to restore a database if migration or deployment issues occur.

## Production readiness checklist

Before production deployment, confirm:

- authentication works correctly
- tenant isolation is enforced
- secrets are not exposed
- CI and tests pass
- backups exist
- rollback steps are understood
- environment variables are configured separately for dev and prod

## Important constraints

- Do not deploy to production without explicit approval.
- Do not create paid infrastructure until the product is approved and the required budget is confirmed.
- Do not automatically run destructive migrations in production.
