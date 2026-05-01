# Test Plan
# School Result Management System (SRMS)

---

## 1) Test levels
- Unit tests: calculation engine, validators
- Integration tests: API endpoints, database interactions
- End-to-end tests: key user flows for admin and teacher
- Visual tests: PDF layout and print output

## 2) Critical test cases

### Admin
- Create, update, delete student
- Bulk upload with duplicate regNo
- Assign subjects to class
- Configure max marks
- Lock and unlock entities

### Teacher
- Select teacher name
- Search student by regNo and name
- Enter valid and invalid marks
- Edit marks and verify update

### Reports
- Generate individual PDF
- Verify totals and grades
- Generate bulk PDF and download ZIP

## 3) PDF validation approach
- Snapshot tests comparing PDF output to approved sample
- Bounding box checks for header, table, footer alignment
- Long name and many-subjects stress tests

## 4) Performance tests
- Single PDF generation under 3 seconds
- Bulk export for 100 students within SLA

## 5) Security tests
- JWT auth required for admin routes
- Rate limiting for public endpoints
- Input validation for all endpoints
