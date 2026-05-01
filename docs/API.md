# API Specification (Draft)
# School Result Management System (SRMS)

Base URL: /api/v1
Auth: JWT for admin endpoints

---

## Auth
- POST /auth/login
- POST /auth/logout

## Students
- GET /students?search=&classId=&page=
- GET /students/:id
- POST /students
- PUT /students/:id
- DELETE /students/:id
- POST /students/bulk-upload

## Classes
- GET /classes
- GET /classes/:id
- POST /classes
- PUT /classes/:id
- DELETE /classes/:id
- POST /classes/:id/subjects
- DELETE /classes/:id/subjects/:subjectId

## Subjects
- GET /subjects
- GET /subjects/:id
- POST /subjects
- PUT /subjects/:id
- DELETE /subjects/:id

## Teachers
- GET /teachers
- POST /teachers
- PUT /teachers/:id
- DELETE /teachers/:id

## Marks
- GET /marks?studentId=&subjectId=
- POST /marks
- PUT /marks/:id

## Reports
- GET /reports/student/:studentId
- POST /reports/bulk
- GET /reports/bulk/:jobId/status
- GET /reports/bulk/:jobId/download

## Logs
- GET /logs?teacherName=&studentId=&subjectId=&from=&to=

## Locks
- GET /locks
- POST /locks
- PUT /locks/:id
- DELETE /locks/:id

---

## Notes
- All POST and PUT endpoints validate input and return 400 on errors.
- All admin endpoints require Authorization: Bearer <token>.
