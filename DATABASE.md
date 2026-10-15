# Database design

## Relationship strategy

The database should be relational and explicit. For a small SaaS, a single PostgreSQL database is enough. Keep the schema simple and enforce ownership through foreign keys and organization IDs.

## Core entities

### User

- `id` — UUID primary key
- `email` — unique, required
- `name` — display name
- `password_hash` — stored by auth library
- `created_at` — timestamp
- `updated_at` — timestamp

A user can belong to multiple organizations.

### Organization

- `id` — UUID primary key
- `name` — required
- `slug` — unique, URL-safe identifier
- `owner_user_id` — user who created the org
- `created_at` — timestamp
- `updated_at` — timestamp

### OrganizationMember

- `id` — UUID primary key
- `organization_id` — FK to Organization
- `user_id` — FK to User
- `role` — enum: owner, organizer, scorer
- `created_at` — timestamp

This table allows a user to join multiple organizations with different roles.

### Tournament

- `id` — UUID primary key
- `organization_id` — FK to Organization
- `name` — required
- `slug` — URL-safe identifier
- `format` — e.g. league, knockout, round robin
- `status` — draft, scheduled, active, completed
- `start_date`, `end_date`
- `created_by_user_id` — user who created it
- `created_at`, `updated_at`

### Team

- `id` — UUID primary key
- `organization_id` — FK to Organization
- `tournament_id` — FK to Tournament
- `name` — required
- `short_name` — optional
- `created_at`, `updated_at`

### Player

- `id` — UUID primary key
- `organization_id` — FK to Organization
- `team_id` — nullable or FK to Team depending on ownership model
- `name` — required
- `role` — batter, bowler, all-rounder, wicketkeeper, etc.
- `jersey_number` — optional
- `created_at`, `updated_at`

### TeamPlayer

- `team_id` — FK to Team
- `player_id` — FK to Player
- `is_captain`, `is_keeper` — optional flags
- `created_at`

This is useful when a player can be linked to a team within a tournament or organization context.

### Venue

- `id` — UUID primary key
- `organization_id` — FK to Organization
- `name` — required
- `location` — optional text
- `created_at`

### Match

- `id` — UUID primary key
- `organization_id` — FK to Organization
- `tournament_id` — FK to Tournament
- `venue_id` — FK to Venue
- `team_a_id` — FK to Team
- `team_b_id` — FK to Team
- `status` — scheduled, live, completed, cancelled
- `scheduled_at` — datetime
- `winner_team_id` — nullable
- `match_result_text` — optional result summary
- `created_at`, `updated_at`

### Innings

- `id` — UUID primary key
- `match_id` — FK to Match
- `batting_team_id` — FK to Team
- `bowling_team_id` — FK to Team
- `inning_number` — 1 or 2
- `runs` — integer
- `wickets` — integer
- `overs` — decimal or format value for overs bowled
- `is_complete` — boolean
- `target_runs` — nullable
- `created_at`, `updated_at`

### ScoreEvent

- `id` — UUID primary key
- `inning_id` — FK to Innings
- `ball_number` — integer
- `over_number` — integer
- `delivery_number` — integer
- `runs` — integer
- `extras` — integer
- `is_no_ball` — boolean
- `is_wide` — boolean
- `is_leg_bye` — boolean
- `is_bye` — boolean
- `wicket_type` — nullable
- `dismissed_player_id` — nullable
- `bowler_player_id` — nullable
- `striker_player_id` — nullable
- `non_striker_player_id` — nullable
- `event_note` — optional
- `created_by_user_id` — user who recorded the event
- `created_at`

This table gives us auditability and state reconstruction. It is better than storing only a single current score state.

### PointsTableEntry

- `id` — UUID primary key
- `tournament_id` — FK to Tournament
- `team_id` — FK to Team
- `played` — integer
- `won` — integer
- `lost` — integer
- `no_result` — integer
- `points` — integer
- `net_run_rate` — decimal
- `updated_at`

This can be persisted if the pool is simple and easy to recalculate, but it should be treated as a derived table unless there is a strong need to store it explicitly.

### AuditLog

- `id` — UUID primary key
- `organization_id` — FK to Organization
- `user_id` — nullable
- `entity_type` — ex: tournament, team, match
- `entity_id` — UUID
- `action` — created, updated, deleted, scored
- `payload` — JSON
- `ip_address` — nullable
- `created_at`

## Data integrity principles

- Use UUIDs for primary keys.
- Use `organization_id` on every tenant-scoped table.
- Use foreign keys for all relationships.
- Use unique constraints to prevent duplicate slugs or emails.
- Do not delete data too aggressively for audit needs; prefer soft delete or log entries when required.
- Keep private records within the organization boundary.

## Deletion and retention

- Organization deletion should cascade or carefully archive dependent records.
- Match and tournament cancellation should be logged.
- Retention should be defined in the security policy, not hidden in code.

## Recommended database setup

- Use PostgreSQL in a managed environment.
- Use Prisma migrations for schema evolution.
- Keep migration history in version control.
- Use development and production databases separately.
- Never use local development credentials as production credentials.
