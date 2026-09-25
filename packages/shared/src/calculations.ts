import type { Term1Marks, Term2Marks, Term1MaxMarks, Term2MaxMarks, SubjectResult, OverallResult } from './types';

// ── Grading scale (fixed per PRD) ────────────────────────────────────────────
export function calcGrade(percentage: number): string {
  if (percentage >= 91) return 'A1';
  if (percentage >= 81) return 'A2';
  if (percentage >= 71) return 'B1';
  if (percentage >= 61) return 'B2';
  if (percentage >= 51) return 'C1';
  if (percentage >= 41) return 'C2';
  if (percentage >= 33) return 'D';
  return 'E';
}

// ── Term totals ───────────────────────────────────────────────────────────────
export function calcTerm1Total(marks: Partial<Term1Marks>): number {
  return (
    (marks.periodicTest ?? 0) +
    (marks.notebook ?? 0) +
    (marks.subEnrichment ?? 0) +
    (marks.halfYearlyExam ?? 0)
  );
}

export function calcTerm2Total(marks: Partial<Term2Marks>): number {
  return (
    (marks.periodicTest ?? 0) +
    (marks.notebook ?? 0) +
    (marks.subEnrichment ?? 0) +
    (marks.yearlyExam ?? 0)
  );
}

export function calcTerm1Max(max: Term1MaxMarks): number {
  return max.periodicTest + max.notebook + max.subEnrichment + max.halfYearlyExam;
}

export function calcTerm2Max(max: Term2MaxMarks): number {
  return max.periodicTest + max.notebook + max.subEnrichment + max.yearlyExam;
}

// ── Per-subject result ────────────────────────────────────────────────────────
export function calcSubjectResult(
  subjectId: string,
  subjectName: string,
  term1Marks: Partial<Term1Marks>,
  term2Marks: Partial<Term2Marks>,
  term1Max: Term1MaxMarks,
  term2Max: Term2MaxMarks,
  isExamOnly?: boolean
): SubjectResult {
  const term1Total = isExamOnly 
    ? (term1Marks.halfYearlyExam ?? 0)
    : calcTerm1Total(term1Marks);
  
  const term2Total = isExamOnly
    ? (term2Marks.yearlyExam ?? 0)
    : calcTerm2Total(term2Marks);
  
  const grandTotal = (term1Total / (isExamOnly ? 1 : 2)) + (term2Total / (isExamOnly ? 1 : 2));
  
  const term1MaxVal = isExamOnly ? term1Max.halfYearlyExam : calcTerm1Max(term1Max);
  const term2MaxVal = isExamOnly ? term2Max.yearlyExam : calcTerm2Max(term2Max);
  
  // Wait, grandTotal is /2 ?
  // In original code: const grandTotal = (term1Total / 2) + (term2Total / 2);
  // This means the overall grand total is average of terms. 
  // If isExamOnly, should it be average of exams? Yes, the same.
  const scaledGrandTotal = (term1Total / 2) + (term2Total / 2);
  const maxGrandTotal = (term1MaxVal / 2) + (term2MaxVal / 2);
  
  const pct = maxGrandTotal > 0 ? (scaledGrandTotal / maxGrandTotal) * 100 : 0;

  return {
    subjectId,
    subjectName,
    term1Total,
    term2Total,
    grandTotal: scaledGrandTotal,
    maxGrandTotal,
    grade: calcGrade(pct),
  };
}

// ── Overall result ────────────────────────────────────────────────────────────
export function calcOverallResult(subjects: SubjectResult[]): Pick<OverallResult, 'totalObtained' | 'totalMax' | 'percentage' | 'overallGrade'> {
  const totalObtained = subjects.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalMax = subjects.reduce((sum, s) => sum + s.maxGrandTotal, 0);
  const percentage = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2)) : 0;

  return {
    totalObtained,
    totalMax,
    percentage,
    overallGrade: calcGrade(percentage),
  };
}
