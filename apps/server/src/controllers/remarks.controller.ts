import { Request, Response } from 'express';
import { Remark } from '../models/Remarks';

export async function getRemarkByStudent(req: Request, res: Response) {
  const { studentId } = req.params;
  const remark = await Remark.findOne({ studentId }).lean();
  res.json(remark ?? null);
}

export async function createOrUpdateRemark(req: Request, res: Response) {
  const { studentId, teacherName, text } = req.body;
  if (!studentId) return res.status(400).json({ message: 'studentId is required' });

  const remark = await Remark.findOneAndUpdate(
    { studentId },
    { studentId, teacherName, text },
    { upsert: true, new: true, runValidators: true }
  );

  res.json(remark);
}

export default { getRemarkByStudent, createOrUpdateRemark };
