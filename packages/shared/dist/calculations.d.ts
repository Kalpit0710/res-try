import type { Term1Marks, Term2Marks, Term1MaxMarks, Term2MaxMarks, SubjectResult, OverallResult } from './types';
export declare function calcGrade(percentage: number): string;
export declare function calcTerm1Total(marks: Partial<Term1Marks>): number;
export declare function calcTerm2Total(marks: Partial<Term2Marks>): number;
export declare function calcTerm1Max(max: Term1MaxMarks): number;
export declare function calcTerm2Max(max: Term2MaxMarks): number;
export declare function calcSubjectResult(subjectId: string, subjectName: string, term1Marks: Partial<Term1Marks>, term2Marks: Partial<Term2Marks>, term1Max: Term1MaxMarks, term2Max: Term2MaxMarks): SubjectResult;
export declare function calcOverallResult(subjects: SubjectResult[]): Pick<OverallResult, 'totalObtained' | 'totalMax' | 'percentage' | 'overallGrade'>;
