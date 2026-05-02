// ─── Shared Types for SRMS ───────────────────────────────────────────────────

// ── Marks structure ──────────────────────────────────────────────────────────
export interface Term1Marks {
  periodicTest: number;
  notebook: number;
  subEnrichment: number;
  halfYearlyExam: number;
}

export interface Term2Marks {
  periodicTest: number;
  notebook: number;
  subEnrichment: number;
  yearlyExam: number;
}

export interface Term1MaxMarks {
  periodicTest: number;
  notebook: number;
  subEnrichment: number;
  halfYearlyExam: number;
}

export interface Term2MaxMarks {
  periodicTest: number;
  notebook: number;
  subEnrichment: number;
  yearlyExam: number;
}

// ── Entities ─────────────────────────────────────────────────────────────────
export interface Student {
  _id: string;
  regNo: string;
  name: string;
  fatherName?: string;
  motherName?: string;
  dob?: string;
  classId: string;
  rollNo?: string;
}

export interface Class {
  _id: string;
  name: string;
  subjects: string[];
}

export interface Subject {
  _id: string;
  name: string;
  classId: string;
  maxMarks: {
    term1: Term1MaxMarks;
    term2: Term2MaxMarks;
  };
}

export interface Teacher {
  _id: string;
  name: string;
}

export interface MarksEntry {
  _id: string;
  studentId: string;
  subjectId: string;
  teacherName: string;
  term1: Partial<Term1Marks>;
  term2: Partial<Term2Marks>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityLog {
  _id: string;
  teacherName: string;
  action: string;
  studentId: string;
  subjectId?: string;
  timestamp: string;
}

export type LockType = 'system' | 'class' | 'student' | 'teacher';

export interface Lock {
  _id: string;
  type: LockType;
  referenceId: string;
  isLocked: boolean;
  updatedAt?: string;
}

// ── Calculation types ─────────────────────────────────────────────────────────
export interface SubjectResult {
  subjectId: string;
  subjectName: string;
  term1Total: number;
  term2Total: number;
  grandTotal: number;
  maxGrandTotal: number;
  grade: string;
}

export interface OverallResult {
  subjects: SubjectResult[];
  totalObtained: number;
  totalMax: number;
  percentage: number;
  overallGrade: string;
}

// ── Co-scholastic ─────────────────────────────────────────────────────────────
export type CoScholasticGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export interface CoScholastic {
  workEducation: { term1: CoScholasticGrade; term2: CoScholasticGrade };
  artEducation: { term1: CoScholasticGrade; term2: CoScholasticGrade };
  healthPE: { term1: CoScholasticGrade; term2: CoScholasticGrade };
  discipline: { term1: CoScholasticGrade; term2: CoScholasticGrade };
}

// ── API response wrapper ──────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
