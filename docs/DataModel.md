# Data Model (Draft)
# School Result Management System (SRMS)

---

## Students
Fields:
- _id (ObjectId)
- regNo (string, unique, required)
- name (string, required)
- fatherName (string)
- motherName (string)
- dob (date)
- classId (ObjectId, required)
- rollNo (string)

Indexes:
- regNo (unique)
- classId

## Classes
Fields:
- _id (ObjectId)
- name (string, unique, required)
- subjects (ObjectId[])

Indexes:
- name (unique)

## Subjects
Fields:
- _id (ObjectId)
- name (string, required)
- classId (ObjectId, required)
- maxMarks.term1 (object)
- maxMarks.term2 (object)

Indexes:
- classId

## Teachers
Fields:
- _id (ObjectId)
- name (string, required)

Indexes:
- name

## Marks
Fields:
- _id (ObjectId)
- studentId (ObjectId, required)
- subjectId (ObjectId, required)
- teacherName (string, required)
- term1 (object)
- term2 (object)
- createdAt, updatedAt

Indexes:
- studentId
- subjectId

## Logs
Fields:
- _id (ObjectId)
- teacherName (string, required)
- action (string, required)
- studentId (ObjectId)
- subjectId (ObjectId)
- timestamp (date)

Indexes:
- studentId
- subjectId
- timestamp

## Locks
Fields:
- _id (ObjectId)
- type (string, enum: system|class|student|teacher)
- referenceId (ObjectId or string)
- isLocked (boolean)
- updatedAt

Indexes:
- type
- referenceId
