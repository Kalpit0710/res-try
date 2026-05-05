# SRMS Server

## Seed Demo Data

Populate the configured MongoDB database with deterministic SRMS demo data. The seed script drops the database first, then recreates only the school data used by the app:

```bash
npm --prefix C:\Users\ASUS\res-try\res-try run seed --workspace=apps/server
```

What gets seeded:
- 3 classes: 3, 4, 5
- 27 subjects total, with the same 9 subjects for each class
- 12 teachers: 3 class teachers and 9 subject teachers
- 6 students
- 27 marks entries for 3 students across all 9 subjects

Default local database name:
- `srms`

The seed script fully clears the configured database before inserting the new curriculum data.

## Environment

Use `apps/server/.env.example` as the template for local setup.
