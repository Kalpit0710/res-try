import { Request, Response } from 'express';
import { CoScholasticMarks } from '../models/CoScholasticMarks';

export async function getCoScholasticMarks(req: Request, res: Response): Promise<void> {
  const { studentId } = req.query;
  const query: Record<string, any> = {};
  if (studentId) query.studentId = studentId;

  const marks = await CoScholasticMarks.find(query).populate('studentId', 'name regNo').lean();
  res.json({ success: true, data: marks });
}

export async function getCoScholasticMarksByStudent(req: Request, res: Response): Promise<void> {
  const { studentId } = req.params;
  const marks = await CoScholasticMarks.find({ studentId }).lean();
  res.json({ success: true, data: marks });
}

export async function createOrUpdateCoScholasticMarks(req: Request, res: Response): Promise<void> {
  const { studentId, area, term1, term2 } = req.body;
  if (!studentId || !area) {
    res.status(400).json({ success: false, message: 'studentId and area are required' });
    return;
  }

  const marks = await CoScholasticMarks.findOneAndUpdate(
    { studentId, area },
    { term1, term2 },
    { upsert: true, new: true, runValidators: true }
  );

  res.json({ success: true, data: marks });
}

export async function deleteCoScholasticMarks(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const marks = await CoScholasticMarks.findByIdAndDelete(id);
  if (!marks) {
    res.status(404).json({ success: false, message: 'Co-scholastic marks not found' });
    return;
  }
  res.json({ success: true, message: 'Co-scholastic marks deleted' });
}
