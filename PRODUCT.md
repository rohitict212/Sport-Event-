# Product definition

## Simple explanation

SportEvent is a practical ticket-to-results system for local cricket tournaments. A tournament organizer can create a competition, add teams and players, schedule matches, score games, calculate the points table, and publish a public results page.

The software is designed for people who are not technical experts. The interface should be simple, mobile-friendly, and easy to understand.

## MVP goals

- No-account shared workspace
- Organization creation
- Tournament management
- Team and player management
- Match schedule and live scoring
- Result entry and tournament points
- Public website for fixtures and results
- Shared access to all organizations and tournament data

## Features excluded from version 1

- Payments
- Billing/subscriptions
- Native apps
- Hardware integrations
- AI analytics
- Large multi-sport operations
- Microservices or Kafka
- Extra infrastructure beyond a clear need

## Access model

There are no end-user accounts, sign-in, roles, or permission checks. Every visitor shares the same workspace and can manage all tournament data. This is suitable only for a private local preview and must not be exposed publicly with real data.

## MVP user journey

1. Visitor opens the shared dashboard.
2. Visitor creates an organization and tournament.
3. Visitor adds teams and player records.
4. Visitor creates a match between the teams.
5. Visitor updates deliveries in real time.
6. The system calculates the result and points table.
7. Anyone with the public tournament link can read results.

## Non-goals for this phase

The repository will not yet include a full front-end app, live scoring engine, or full production database setup. That work is planned after the architecture is approved.
