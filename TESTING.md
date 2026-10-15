# Testing strategy

## Testing pyramid

The project should use a layered testing strategy:

- Unit tests for scoring rules and validation logic
- Integration tests for API authorization and database behavior
- End-to-end tests for user journeys

## Required test areas

- Registration and login
- Organization creation
- Tournament creation
- Team and player management
- Match scheduling
- Cricket scoring
- Points-table calculations
- Public results page
- Input validation
- Unauthorized requests
- Error handling

## Critical e2e journey

1. Organizer logs in.
2. Organizer creates an organization.
3. Organizer creates a tournament.
4. Organizer adds two teams.
5. Organizer adds players.
6. Organizer creates a match.
7. Scorer records deliveries.
8. Match result is calculated.
9. Points table updates.
10. Public visitor views the result page.

## Scoring tests

The scoring engine should be tested for:

- legal and illegal deliveries
- wides and no-balls
- byes and leg-byes
- wickets and dismissals
- over completion
- target and chase calculations
- innings completion and results

## Security tests

- User can only access authorized organization records
- Changing `organizationId` or `tournamentId` does not bypass security
- Scorer cannot modify admin settings
- Invalid payloads are rejected
- Public visitors cannot read private data

## Commands to run later

```bash
npm run lint
npm run typecheck
npm test
npm run e2e
npm run build
```

The exact scripts will be defined once the application foundation is implemented. The important requirement is that the checks run automatically in CI and before release.
