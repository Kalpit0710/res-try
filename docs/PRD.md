# 📄 PRODUCT REQUIREMENTS DOCUMENT (PRD)
## 🏫 School Result Management System (SRMS)
**Version:** 1.0  
**Type:** Internal School Web Application  
**Tech Stack:** React + Node.js + MongoDB  

---

# 1. 🎯 PRODUCT VISION

To build a centralized, admin-controlled system that enables:

- Efficient student data management  
- Flexible subject/class configuration  
- Seamless marks entry (without teacher login friction)  
- Accurate automated result computation  
- Pixel-perfect PDF report card generation  

> ⚠️ Core Principle: The generated PDF report card is the final product.

---

# 2. 👥 USER ROLES

## 2.1 Admin (Authenticated)

# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# School Result Management System (SRMS)
Version: 1.0
Type: Internal school web application
Tech stack: React + Node.js + MongoDB
Last updated: 2026-05-01

---

## 1) Product vision

Build a centralized, admin-controlled system that enables:

- Efficient student data management
- Flexible subject and class configuration
- Seamless marks entry without teacher login friction
- Accurate automated result computation
- Pixel-perfect PDF report card generation

Core principle: The generated PDF report card is the final product. Everything else supports it.

---

## 2) Goals and non-goals

### Goals
- Admin can manage students, classes, subjects, teachers, marks structure, locks, and reports end-to-end.
- Teachers can enter marks quickly without authentication.
- Reports are consistent, print-ready, and match the approved template.
- Bulk operations (import, export) are reliable and auditable.

### Non-goals (for v1)
- Parent/student portal
- Teacher authentication and role-based access control beyond locks
- Analytics dashboards beyond standard reports

---

## 3) User roles

### 3.1 Admin (authenticated)
Capabilities:
- Full CRUD on all entities
- Configure marks structure
- Manage locking system
- Generate individual and bulk reports
- View activity logs

### 3.2 Teacher (no authentication)
Flow:
Select name -> Search student -> Enter marks -> Generate result

Constraints:
- No login system in v1
- No restrictions beyond lock controls

---

## 4) Core modules and requirements

### 4.1 Student management
Fields:
- id (GUID)
- regNo (unique)
- name
- fatherName
- motherName
- dob
- classId
- rollNo

Features:
- Add, edit, delete students
- Search and filter by reg no, name, class, roll no
- Bulk upload via Excel

Excel upload rules:
- Required: regNo, name, class
- Validate duplicates by regNo within file and in system
- Provide error report for failed rows

### 4.2 Class management
- Create, edit, delete classes
- Assign subjects dynamically to classes

### 4.3 Subject management
- Create subjects
- Link and unlink subjects to class
- Configure max marks per component

### 4.4 Teacher management
Fields:
- id
- name

Usage:
- Teacher name selection during marks entry
- Activity logs

### 4.5 Marks structure
Term structure (fixed):
Term 1 components:
- Periodic Test
- Notebook
- Sub Enrichment
- Half Yearly Exam

Term 2 components:
- Periodic Test
- Notebook
- Sub Enrichment
- Yearly Exam

Configurable:
- Max marks per component, per class and subject

### 4.6 Marks entry module
Teacher flow:
1) Select teacher name
2) Search student (regNo, name, class)
3) Select subject
4) Enter marks for Term 1 and Term 2

Features:
- Inline validation against max marks
- Edit and update marks
- Auto-save (recommended)
- Real-time calculation preview

### 4.7 Result calculation engine
Per subject:
- Term 1 total
- Term 2 total
- Grand total

Overall:
- Total marks
- Percentage
- Grade

Formula:
Term total = sum of components
Grand total = Term1 + Term2
Percentage = (Total obtained / Total max) * 100

Grading system (fixed):
| Marks Range | Grade |
|------------|-------|
| 91-100     | A1    |
| 81-90      | A2    |
| 71-80      | B1    |
| 61-70      | B2    |
| 51-60      | C1    |
| 41-50      | C2    |
| 33-40      | D     |
| <=32       | E     |

### 4.8 PDF report generation (critical)
Objective: Generate a print-ready A4 PDF matching the approved sample exactly.

Layout specification:
- Page: A4, portrait, 10-15mm margins, Arial/Helvetica
- Sections: header, student profile, scholastic table, summary, co-scholastic, remarks, signatures, footer
- Scholastic table: dynamic subjects, last row is TOTAL, center-align numbers, left-align subject names

Technical approach:
- Build HTML template
- Inject dynamic data
- Convert using Puppeteer
- Avoid canvas-based manual drawing

Export options:
- Individual PDF
- Bulk ZIP export

Constraints:
- Layout must not break with variable subjects or long names
- Print-friendly margins and alignment

Acceptance criteria:
- PDF matches template within allowable printer tolerance (<=2mm)
- All fields render without overlap at max expected string lengths
- Total and grade calculations in PDF match calculation engine output

### 4.9 Locking system
Admin controls:
- Lock/unlock: system, class, student, teacher

Behavior:
- Locked entities cannot be edited
- UI reflects lock state consistently

### 4.10 Activity logs
Track:
- Teacher name
- Action performed
- Student affected
- Subject
- Timestamp

---

## 5) System architecture (high level)

Frontend:
- React.js
- Tailwind CSS
- Framer Motion

Backend:
- Node.js + Express

Database:
- MongoDB (Atlas)

Architecture style:
- REST API
- Modular backend
- Component-based frontend

---

## 6) Data model (high level)

Students
{
  _id,
  regNo,
  name,
  fatherName,
  motherName,
  dob,
  classId,
  rollNo
}

Classes
{
  _id,
  name,
  subjects: [subjectId]
}

Subjects
{
  _id,
  name,
  classId,
  maxMarks: {
    term1: {},
    term2: {}
  }
}

Teachers
{
  _id,
  name
}

Marks
{
  studentId,
  subjectId,
  teacherName,
  term1: {},
  term2: {}
}

Logs
{
  teacherName,
  action,
  studentId,
  subjectId,
  timestamp
}

Locks
{
  type, // system | class | student | teacher
  referenceId,
  isLocked
}

---

## 7) UI/UX design notes

Theme: Orange, white, black

Desktop:
- Sidebar layout
- Dashboard cards
- Data tables

Mobile:
- Bottom navigation (island style)
- Simplified forms

Key screens:
- Admin: Dashboard, Students, Classes, Subjects, Teachers, Reports, Logs, Settings
- Teacher: Name selection, Student search, Marks entry, Result preview

---

## 8) Performance and reliability

- Async PDF generation for bulk export
- Cache student lists and class-subject mapping
- Idempotent bulk operations where possible

---

## 9) Security

- JWT-based admin authentication
- Input validation and sanitization
- Rate limiting on public-facing endpoints
- Lock-based access control

---

## 10) Deployment

- Frontend: Vercel
- Backend: Render or AWS
- Database: MongoDB Atlas

---

## 11) Development phases (proposed)

Phase 1:
- Auth
- Student management
- Class and subject setup

Phase 2:
- Marks entry
- Calculation engine

Phase 3:
- PDF generation (core)

Phase 4:
- Bulk export
- Logs
- Locking system

Phase 5:
- UI polish and animations

---

## 12) Open questions

- What are the maximum class sizes and subjects per class for PDF layout stress tests?
- Should co-scholastic grades be editable or fixed per report?
- Do we need support for multiple academic sessions in v1?