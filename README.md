# School Result Management System

Web application built from the PRD for:
- Admin authentication
- Student record management with UUID + admission number identity model
- Class, section, subject, and class-subject mapping
- Half-yearly and final term marks entry
- Computed totals, percentage, and grade
- Report card generation (PDF)
- Excel student import/export and result export

## Tech Stack

- Next.js (App Router, API routes)
- TypeScript
- PostgreSQL
- Prisma ORM
- bcrypt (password hashing)
- JWT (cookie-based auth)
- XLSX (Excel import/export)
- PDFKit (PDF report card)

## Setup

1. Install dependencies:

```bash
cmd /c npm install
```

2. Create environment file:

```bash
copy .env.example .env
```

3. Create database schema:

```bash
cmd /c npm run prisma:generate
cmd /c npm run prisma:migrate -- --name init
```

4. Start the app:

```bash
cmd /c npm run dev
```

5. Initialize default admin and grading ranges from the login page using `Initialize`.

Default credentials (from `.env.example`):
- email: `admin@school.local`
- password: `admin123`

## Key API Endpoints

- `POST /api/setup/seed`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET/POST /api/classes`
- `GET/POST /api/sections`
- `GET/POST /api/subjects`
- `GET/POST/DELETE /api/class-subjects`
- `GET/POST /api/students`
- `POST /api/students/import`
- `GET /api/students/export`
- `GET/PUT /api/marks/:studentId`
- `GET /api/reports/:studentId?format=pdf`
- `GET /api/results?format=excel`

## Notes

- All primary identities use UUID v4 (Prisma `uuid()` defaults).
- Admission number is unique and immutable after student creation.
- Marks are editable at any time and result rows are recalculated on save.
