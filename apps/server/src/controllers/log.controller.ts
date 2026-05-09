import { Request, Response } from 'express';
import { Log } from '../models/Log';

// GET /logs?teacherName=&studentId=&subjectId=&from=&to=&page=&limit=
export async function getLogs(req: Request, res: Response): Promise<void> {
  const { teacherName, studentId, subjectId, from, to, page = '1', limit = '50' } = req.query as Record<string, string>;
  const query: Record<string, unknown> = {};

  if (teacherName) query.teacherName = teacherName;
  if (studentId) query.studentId = studentId;
  if (subjectId) query.subjectId = subjectId;

  if (from || to) {
    query.timestamp = {};
    if (from) (query.timestamp as Record<string, unknown>).$gte = new Date(from);
    if (to) (query.timestamp as Record<string, unknown>).$lte = new Date(to);
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    Log.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('studentId', 'name regNo')
      .populate('subjectId', 'name')
      .lean(),
    Log.countDocuments(query),
  ]);

  res.json({ success: true, data: logs, total, page: pageNum, limit: limitNum });
}

