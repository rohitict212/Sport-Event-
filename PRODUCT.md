# Product definition

## Simple explanation

SportEvent is a practical ticket-to-results system for local cricket tournaments. A tournament organizer can create a competition, add teams and players, schedule matches, score games, calculate the points table, and publish a public results page.

The software is designed for people who are not technical experts. The interface should be simple, mobile-friendly, and easy to understand.

## MVP goals

- Organizer registration and login
- Organization creation
- Tournament management
- Team and player management
- Match schedule and live scoring
- Result entry and tournament points
- Public website for fixtures and results
- Protected data so one organization cannot see another organization's private data

## Features excluded from version 1

- Payments
- Billing/subscriptions
- Native apps
- Hardware integrations
- AI analytics
- Large multi-sport operations
- Microservices or Kafka
- Extra infrastructure beyond a clear need

## User roles

### Platform admin

- Oversees the platform globally
- Reviews tenant health
- Can help with support or emergency cleanup
- Should not be confused with an organization organizer

### Organization owner / organizer

- Creates and manages one or more organizations
- Creates tournaments
- Adds teams, players, and venues
- Schedules matches
- Records scoring events
- Publishes results
- Can only access authorized organization data

### Scorer

- Limited to match-scoring actions
- May record live ball-by-ball updates for assigned matches
- Cannot edit organization settings or user permissions

### Public visitor

- Reads public tournament information
- Views fixtures, standings, and results
- Cannot manage private organization data

## Permission model

Permissions should be explicit and checked on the server. The frontend may hide actions, but the backend is the real authority.

Examples:

- `organization:read` — view organization data
- `organization:update` — edit organization settings
- `tournament:create` — create a tournament within an organization
- `tournament:update` — edit an existing tournament
- `team:manage` — add or delete teams
- `player:manage` — add or delete players
- `match:manage` — create or update matches
- `score:write` — record scoring events
- `audit:read` — view audit logs

## MVP user journey

1. Organizer signs up.
2. Organizer creates an organization.
3. Organizer creates a tournament.
4. Organizer adds two teams.
5. Organizer adds player records.
6. Organizer creates a match between the teams.
7. Scorer updates deliveries in real time.
8. The system calculates the result.
9. The points table updates.
10. A public visitor opens the tournament link and reads results.

## Non-goals for this phase

The repository will not yet include a full front-end app, live scoring engine, or full production database setup. That work is planned after the architecture is approved.
