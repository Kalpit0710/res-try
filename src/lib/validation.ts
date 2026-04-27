import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const classSchema = z.object({
  name: z.string().trim().min(1),
});

export const sectionSchema = z.object({
  classId: z.string().uuid(),
  name: z.string().trim().min(1),
  classTeacherName: z.string().trim().default(""),
});

export const subjectSchema = z.object({
  name: z.string().trim().min(1),
});

export const classSubjectSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
});

export const studentSchema = z.object({
  admissionNumber: z.string().trim().min(1),
  name: z.string().trim().min(1),
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
  dateOfBirth: z.string().optional().nullable(),
  parentName: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
});

export const marksUpsertSchema = z.object({
  subjectId: z.string().uuid(),
  halfYearlyMarks: z.number().min(0).max(100),
  finalTermMarks: z.number().min(0).max(100),
});

export const marksBulkSchema = z.object({
  marks: z.array(marksUpsertSchema).min(1),
});

export const gradeRangeSchema = z.object({
  min: z.number().min(0).max(100),
  max: z.number().min(0).max(100),
  grade: z.string().trim().min(1),
});

export const gradeRangesSchema = z.object({
  ranges: z.array(gradeRangeSchema).min(1),
});
