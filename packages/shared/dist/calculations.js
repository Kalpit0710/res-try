"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcGrade = calcGrade;
exports.calcTerm1Total = calcTerm1Total;
exports.calcTerm2Total = calcTerm2Total;
exports.calcTerm1Max = calcTerm1Max;
exports.calcTerm2Max = calcTerm2Max;
exports.calcSubjectResult = calcSubjectResult;
exports.calcOverallResult = calcOverallResult;
// ── Grading scale (fixed per PRD) ────────────────────────────────────────────
function calcGrade(percentage) {
    if (percentage >= 91)
        return 'A1';
    if (percentage >= 81)
        return 'A2';
    if (percentage >= 71)
        return 'B1';
    if (percentage >= 61)
        return 'B2';
    if (percentage >= 51)
        return 'C1';
    if (percentage >= 41)
        return 'C2';
    if (percentage >= 33)
        return 'D';
    return 'E';
}
// ── Term totals ───────────────────────────────────────────────────────────────
function calcTerm1Total(marks) {
    return ((marks.periodicTest ?? 0) +
        (marks.notebook ?? 0) +
        (marks.subEnrichment ?? 0) +
        (marks.halfYearlyExam ?? 0));
}
function calcTerm2Total(marks) {
    return ((marks.periodicTest ?? 0) +
        (marks.notebook ?? 0) +
        (marks.subEnrichment ?? 0) +
        (marks.yearlyExam ?? 0));
}
function calcTerm1Max(max) {
    return max.periodicTest + max.notebook + max.subEnrichment + max.halfYearlyExam;
}
function calcTerm2Max(max) {
    return max.periodicTest + max.notebook + max.subEnrichment + max.yearlyExam;
}
// ── Per-subject result ────────────────────────────────────────────────────────
function calcSubjectResult(subjectId, subjectName, term1Marks, term2Marks, term1Max, term2Max) {
    const term1Total = calcTerm1Total(term1Marks);
    const term2Total = calcTerm2Total(term2Marks);
    const grandTotal = term1Total + term2Total;
    const maxGrandTotal = calcTerm1Max(term1Max) + calcTerm2Max(term2Max);
    const pct = maxGrandTotal > 0 ? (grandTotal / maxGrandTotal) * 100 : 0;
    return {
        subjectId,
        subjectName,
        term1Total,
        term2Total,
        grandTotal,
        maxGrandTotal,
        grade: calcGrade(pct),
    };
}
// ── Overall result ────────────────────────────────────────────────────────────
function calcOverallResult(subjects) {
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
