import { Request, Response } from 'express';
import { Log } from '../models/Log';

// GET /logs?teacherName=&studentId=&subjectId=&from=&to=
export async function getLogs(req: Request, res: Response): Promise<void> {
  const { teacherName, studentId, subjectId, from, to } = req.query as Record<string, string>;
  const query: Record<string, unknown> = {};

  if (teacherName) query.teacherName = teacherName;
  if (studentId) query.studentId = studentId;
  if (subjectId) query.subjectId = subjectId;

  if (from || to) {
    query.timestamp = {};
    if (from) (query.timestamp as Record<string, unknown>).$gte = new Date(from);
    if (to) (query.timestamp as Record<string, unknown>).$lte = new Date(to);
  }

  const logs = await Log.find(query)
    .sort({ timestamp: -1 })
    .limit(500)
    .populate('studentId', 'name regNo')
    .populate('subjectId', 'name')
    .lean();

  res.json({ success: true, data: logs });
}
