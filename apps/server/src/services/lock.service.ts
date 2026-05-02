import { Lock } from '../models/Lock';

export type LockCheckResult =
  | { locked: false }
  | { locked: true; reason: string };

export async function checkLocks(params: {
  studentId?: string;
  classId?: string;
  teacherReference?: string;
}): Promise<LockCheckResult> {
  // Convention: system lock uses referenceId = 'global'
  const checks: Array<{ type: 'system' | 'class' | 'student' | 'teacher'; referenceId: string; reason: string }> = [
    { type: 'system', referenceId: 'global', reason: 'System is locked' },
  ];

  if (params.classId) checks.push({ type: 'class', referenceId: params.classId, reason: 'Class is locked' });
  if (params.studentId) checks.push({ type: 'student', referenceId: params.studentId, reason: 'Student is locked' });
  if (params.teacherReference) checks.push({ type: 'teacher', referenceId: params.teacherReference, reason: 'Teacher is locked' });

  const existing = await Lock.find({
    $or: checks.map(c => ({ type: c.type, referenceId: c.referenceId, isLocked: true })),
  }).lean();

  if (!existing.length) return { locked: false };

  // Prefer most specific reason (system first is fine too, but show a stable message)
  const first = existing[0];
  const meta = checks.find(c => c.type === first.type && c.referenceId === first.referenceId);
  return { locked: true, reason: meta?.reason ?? 'Locked' };
}
