import { Request, Response } from 'express';
import { Student } from '../models/Student';
import { Class } from '../models/Class';
import { Subject } from '../models/Subject';
import { Teacher } from '../models/Teacher';
import { Log } from '../models/Log';
import { Lock } from '../models/Lock';

// GET /api/v1/dashboard/stats
// Returns all dashboard counts + recent logs + locks in ONE round-trip
export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  const [
    studentsTotal,
    classesCount,
    subjectsCount,
    teachersCount,
    locks,
    recentLogs,
  ] = await Promise.all([
    Student.countDocuments(),
    Class.countDocuments(),
    Subject.countDocuments(),
    Teacher.countDocuments(),
    Lock.find().lean(),
    Log.find()
      .sort({ timestamp: -1 })
      .limit(6)
      .populate('studentId', 'name regNo')
      .populate('subjectId', 'name')
      .lean(),
  ]);

  res.json({
    success: true,
    data: {
      studentsTotal,
      classesCount,
      subjectsCount,
      teachersCount,
      locks,
      recentLogs,
    },
  });
}
