import { Request, Response } from 'express';
import { Subject } from '../models/Subject';

export async function getSubjects(req: Request, res: Response): Promise<void> {
  const { classId } = req.query;
  const query = classId ? { classId } : {};
  const subjects = await Subject.find(query).populate('classId', 'name').lean();
  res.json({ success: true, data: subjects });
}

export async function getSubjectById(req: Request, res: Response): Promise<void> {
  const subject = await Subject.findById(req.params.id).lean();
  if (!subject) { res.status(404).json({ success: false, message: 'Subject not found' }); return; }
  res.json({ success: true, data: subject });
}

export async function createSubject(req: Request, res: Response): Promise<void> {
  const { name, classId, maxMarks } = req.body;
  if (!name || !classId) { res.status(400).json({ success: false, message: 'name and classId are required' }); return; }
  const subject = await Subject.create({ name, classId, maxMarks });
  res.status(201).json({ success: true, data: subject });
}

export async function updateSubject(req: Request, res: Response): Promise<void> {
  const { name, classId, maxMarks } = req.body;
  const subject = await Subject.findByIdAndUpdate(
    req.params.id, { name, classId, maxMarks }, { new: true, runValidators: true }
  );
  if (!subject) { res.status(404).json({ success: false, message: 'Subject not found' }); return; }
  res.json({ success: true, data: subject });
}

export async function deleteSubject(req: Request, res: Response): Promise<void> {
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) { res.status(404).json({ success: false, message: 'Subject not found' }); return; }
  res.json({ success: true, message: 'Subject deleted' });
}
