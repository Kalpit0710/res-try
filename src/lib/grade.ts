import type { GradeRange } from "@prisma/client";

export function resolveGrade(percentage: number, ranges: GradeRange[]) {
  const match = ranges.find((range) => percentage >= range.min && percentage <= range.max);
  return match?.grade ?? "N/A";
}

export function normalizeRanges(ranges: Array<{ min: number; max: number; grade: string }>) {
  return [...ranges].sort((a, b) => a.min - b.min);
}
