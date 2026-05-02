# Software Requirements Specification (SRS)
# School Result Management System (SRMS)
Version: 1.0

---

## 1) Scope
SRMS is an internal web application for school admins to manage student data, configure marks, and generate PDF report cards. Teachers can enter marks without authentication, controlled by a locking system.

## 2) Definitions
- Admin: Authenticated user with full control.
- Teacher: Unauthenticated user for marks entry.
- Lock: A restriction preventing edits for a scope.

## 3) Functional requirements

### 3.1 Authentication
- FR-1: Admin shall log in with username and password.
- FR-2: Admin shall log out and invalidate the session.

### 3.2 Student management
- FR-3: Admin shall create, update, delete students.
- FR-4: Admin shall search students by regNo, name, class, rollNo.
- FR-5: Admin shall bulk upload students via Excel.
- FR-6: System shall validate duplicates and required fields during upload.
- FR-7: System shall produce an error report for failed rows.

### 3.3 Class management
- FR-8: Admin shall create, update, delete classes.
- FR-9: Admin shall assign subjects to classes.

### 3.4 Subject management
- FR-10: Admin shall create, update, delete subjects.
- FR-11: Admin shall configure max marks per term component per class and subject.

### 3.5 Teacher management
- FR-12: Admin shall create, update, delete teachers.
- FR-13: Teacher list shall be selectable during marks entry.

### 3.6 Marks entry
- FR-14: Teacher shall select their name before entry.
- FR-15: Teacher shall search students by regNo, name, class.
- FR-16: Teacher shall enter term 1 and term 2 marks per subject.
- FR-17: System shall validate marks against max marks.
- FR-18: System shall auto-save marks when enabled.
- FR-19: System shall show real-time totals and grade preview.

### 3.7 Result calculation
- FR-20: System shall compute term totals per subject.
- FR-21: System shall compute grand totals per subject.
- FR-22: System shall compute overall total, percentage, and grade.
- FR-23: System shall use the fixed grading table.

### 3.8 Reports
- FR-24: System shall generate an A4 PDF report matching the approved template.
- FR-25: System shall allow individual PDF export.
- FR-26: System shall allow bulk PDF export as a ZIP.
- FR-27: PDF output shall be consistent with calculation engine results.

### 3.9 Locking
- FR-28: Admin shall lock and unlock system, class, student, and teacher.
- FR-29: Locked entities shall be read-only for edits.
- FR-30: UI shall display lock state.

### 3.10 Activity logs
- FR-31: System shall log teacher name, action, student, subject, timestamp.
- FR-32: Admin shall view activity logs with filters.

## 4) Non-functional requirements
- NFR-1: PDF generation time for a single report shall be <= 3 seconds on standard server hardware.
- NFR-2: Bulk PDF export shall be processed asynchronously with progress tracking.
- NFR-3: API endpoints shall respond in <= 500ms for standard CRUD operations at 200 concurrent users.
- NFR-4: System shall validate input server-side and client-side.
- NFR-5: System shall use JWT for admin authentication.
- NFR-6: System shall log critical actions for audit.

## 5) Constraints
- Fixed term structure and grading scale in v1.
- Teacher role has no authentication in v1.
- PDF layout must not break with long names or variable subjects.

## 6) Assumptions
- Each student belongs to one class.
- Each class has a defined set of subjects.
- Each subject uses the same component list across term 1 and term 2.

## 7) Acceptance criteria
- All FRs and NFRs verified by automated and manual tests.
- PDF matches template within printer tolerance (<= 2mm).
- Calculation outputs match PDF values for 100% of test cases.
