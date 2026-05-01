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

### Capabilities:
- Full system control
- CRUD operations on all entities
- Configure marks structure
- Manage locking system
- Generate reports (individual + bulk)
- View logs and activity tracking

---

## 2.2 Teacher (No Authentication)

### Workflow:
1. Select name
2. Search student
3. Enter marks
4. Generate result

### Constraints:
- No login system
- No access restrictions (initial version)
- Controlled via locking system

---

# 3. 🧩 CORE MODULES

---

## 3.1 Student Management

### Fields:
- `id (GUID)`
- `regNo (UNIQUE)`
- `name`
- `fatherName`
- `motherName`
- `dob`
- `classId`
- `rollNo`

### Features:
- Add / Edit / Delete students
- Search and filter
- Bulk upload via Excel

### Excel Upload Rules:
- Required: Reg No, Name, Class
- Validate duplicates
- Show error report for failed rows

---

## 3.2 Class Management

### Features:
- Create / Edit / Delete classes
- Assign subjects dynamically

---

## 3.3 Subject Management

### Features:
- Create subjects
- Link/unlink subjects to class
- Configure max marks per component

---

## 3.4 Teacher Management

### Fields:
- `id`
- `name`

### Purpose:
- Used for selection during marks entry
- Used in activity logs

---

## 3.5 Marks Structure

### Term Structure (Fixed)

#### Term 1:
- Periodic Test
- Notebook
- Sub Enrichment
- Half Yearly Exam

#### Term 2:
- Periodic Test
- Notebook
- Sub Enrichment
- Yearly Exam

### Configurable:
- Max marks per component (per class + subject)

---

## 3.6 Marks Entry Module

### Teacher Flow:
1. Select teacher name
2. Search student (Reg No / Name / Class)
3. Select subject
4. Enter marks (Term 1 & Term 2)

### Features:
- Inline validation
- Edit/update marks
- Auto-save (recommended)
- Real-time calculation preview

---

## 3.7 Result Calculation Engine

### Per Subject:
- Term 1 Total
- Term 2 Total
- Grand Total

### Overall:
- Total Marks
- Percentage
- Grade

### Formula:
Term Total = Sum of components
Grand Total = Term1 + Term2
Percentage = (Total Obtained / Total Max) * 100


---

### Grading System:

| Marks Range | Grade |
|------------|------|
| 91–100     | A1   |
| 81–90      | A2   |
| 71–80      | B1   |
| 61–70      | B2   |
| 51–60      | C1   |
| 41–50      | C2   |
| 33–40      | D    |
| ≤32        | E    |

---

## 3.8 PDF Report Generation (CRITICAL MODULE)

---

### Objective:
Generate a print-ready A4 PDF matching the provided sample exactly.

---

## Layout Specification

### Page Setup:
- Size: A4
- Orientation: Portrait
- Margins: 10–15mm
- Font: Arial / Helvetica

---

### Section Breakdown:

#### 1. Header
- School logo (admin upload)
- School name
- "PROGRESS REPORT"
- Academic session
- Admission number

---

#### 2. Student Profile
- Name
- Father’s Name
- Mother’s Name
- Class
- DOB
- Roll No.

---

#### 3. Scholastic Table

| Subject | Term 1 | Term 2 | Final |
|--------|--------|--------|------|

##### Term 1:
- Periodic Test
- Notebook
- Sub Enrichment
- Half Yearly Exam
- Total

##### Term 2:
- Periodic Test
- Notebook
- Sub Enrichment
- Yearly Exam
- Total

##### Final:
- Grand Total
- Grade

---

#### Rules:
- Dynamic subjects per class
- Last row = TOTAL
- Center align numbers
- Left align subject names

---

#### 4. Summary Section
- Total Marks
- Percentage
- Grade

---

#### 5. Co-Scholastic Area

| Area | Term 1 | Term 2 |
|------|--------|--------|
| Work Education | A1 | A1 |
| Art Education | A1 | A2 |
| Health & Physical | A2 | A1 |
| Discipline | A1 | A1 |

---

#### 6. Remarks Section
- Promotion status
- Teacher remarks

---

#### 7. Signatures
- Class Teacher
- Exam Cell
- Principal

---

#### 8. Footer
- Grading scale reference table

---

## PDF Generation Strategy

### Recommended Approach:
- Create HTML template
- Inject dynamic data
- Convert using Puppeteer

### Avoid:
- Manual PDF drawing (canvas-based)

---

## Export Options:
- Individual PDF
- Bulk ZIP export

---

## Constraints:
- Must not break layout with:
  - Variable subjects
  - Long names
- Must be print-friendly

---

## 3.9 Locking System

### Admin Controls:
- Lock/unlock:
  - Entire system
  - Class
  - Student
  - Teacher

### Behavior:
- Locked → Editing disabled
- UI must reflect lock state

---

## 3.10 Activity Logs

### Track:
- Teacher name
- Action performed
- Student affected
- Subject
- Timestamp

---

# 4. 🧠 SYSTEM ARCHITECTURE

---

## Frontend:
- React.js
- Tailwind CSS
- Framer Motion

---

## Backend:
- Node.js + Express

---

## Database:
- MongoDB (Atlas)

---

## Architecture Style:
- REST API
- Modular structure

---

# 5. 🗄️ DATABASE DESIGN (HIGH LEVEL)

## Collections:

### Students
```json
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
  subjects: []
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
  type,
  referenceId,
  isLocked
}

6. 🔌 API MODULES
Auth
Students
Classes
Subjects
Teachers
Marks
Reports
Logs
Locks
7. 🎨 UI/UX DESIGN
Theme:
Orange + White + Black
Desktop:
Sidebar layout
Dashboard cards
Tables
Mobile:
Bottom navigation (island style)
Simplified UI
Screens:
Admin:
Dashboard
Students
Classes
Subjects
Teachers
Reports
Logs
Settings
Teacher:
Name selection
Student search
Marks entry
Result preview
8. ⚡ PERFORMANCE
Async PDF generation for bulk
Caching for:
Student lists
Class-subject mapping
9. 🔒 SECURITY
JWT-based admin authentication
Input validation
Rate limiting
Lock-based access control
10. 🚀 DEPLOYMENT
Frontend: Vercel
Backend: Render / AWS
Database: MongoDB Atlas
11. 🚧 DEVELOPMENT PHASES
Phase 1:
Auth
Student management
Class & subject setup
Phase 2:
Marks entry
Calculation engine
Phase 3:
PDF generation (core)
Phase 4:
Bulk export
Logs
Locking system
Phase 5:
UI polish and animations