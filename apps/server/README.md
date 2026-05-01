# SRMS Server

## Seed Demo Data

Populate the configured MongoDB database with deterministic SRMS demo data:

```bash
npm --prefix C:\Users\ASUS\res-try\res-try run seed --workspace=apps/server
```

What gets seeded:
- 4 classes
- 4 teachers
- 6 students
- 6 marks entries for the report-card flow
- 3 activity logs
- 5 lock records

Future-ready fixtures included:
- `11-Science` class
- `Artificial Intelligence` subject in `10-A`

Default local database name:
- `srms`

The seed script clears and recreates the SRMS collections it owns so the output stays repeatable.

## Environment

Use `apps/server/.env.example` as the template for local setup.
