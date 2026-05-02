# Architecture Overview
# School Result Management System (SRMS)

---

## 1) System components
- Frontend: React + Tailwind CSS + Framer Motion
- Backend: Node.js + Express
- Database: MongoDB Atlas
- PDF engine: Puppeteer

## 2) High-level flow
1) Admin manages master data (students, classes, subjects, teachers).
2) Admin configures max marks per class and subject.
3) Teacher enters marks, system validates and saves.
4) Calculation engine computes totals and grades.
5) Report service renders HTML and generates PDF via Puppeteer.

## 3) Backend modules
- Auth: admin login and session management.
- Students: CRUD, search, bulk upload.
- Classes: CRUD, subject assignment.
- Subjects: CRUD, max marks configuration.
- Teachers: CRUD.
- Marks: create and update, fetch for reports.
- Reports: HTML template rendering, PDF generation, bulk export.
- Logs: write and read activity logs.
- Locks: apply and remove locks.

## 4) Data flow
- Frontend -> REST API -> MongoDB.
- PDF generation:
  - API collects data
  - Server renders HTML template
  - Puppeteer generates PDF
  - File is streamed or stored for bulk export

## 5) Deployment
- Frontend: Vercel
- Backend: Render or AWS
- MongoDB: Atlas
- Optional: object storage for bulk exports

## 6) Scaling notes
- Separate worker for bulk PDF generation.
- Queue-based processing for export jobs.
- Cache class-subject mapping and student lists.
