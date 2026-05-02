import { Request, Response } from 'express';
import { Class } from '../models/Class';

export async function getClasses(_req: Request, res: Response): Promise<void> {
  const classes = await Class.find().populate('subjects', 'name').lean();
  res.json({ success: true, data: classes });
}

export async function getClassById(req: Request, res: Response): Promise<void> {
  const cls = await Class.findById(req.params.id).populate('subjects').lean();
  if (!cls) { res.status(404).json({ success: false, message: 'Class not found' }); return; }
  res.json({ success: true, data: cls });
}

export async function createClass(req: Request, res: Response): Promise<void> {
  const { name } = req.body;
  if (!name) { res.status(400).json({ success: false, message: 'name is required' }); return; }
  const cls = await Class.create({ name });
  res.status(201).json({ success: true, data: cls });
}

export async function updateClass(req: Request, res: Response): Promise<void> {
  const cls = await Class.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
  if (!cls) { res.status(404).json({ success: false, message: 'Class not found' }); return; }
  res.json({ success: true, data: cls });
}

export async function deleteClass(req: Request, res: Response): Promise<void> {
  const cls = await Class.findByIdAndDelete(req.params.id);
  if (!cls) { res.status(404).json({ success: false, message: 'Class not found' }); return; }
  res.json({ success: true, message: 'Class deleted' });
}

export async function addSubjectToClass(req: Request, res: Response): Promise<void> {
  const { subjectId } = req.body;
  const cls = await Class.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { subjects: subjectId } },
    { new: true }
  );
  if (!cls) { res.status(404).json({ success: false, message: 'Class not found' }); return; }
  res.json({ success: true, data: cls });
}

export async function removeSubjectFromClass(req: Request, res: Response): Promise<void> {
  const cls = await Class.findByIdAndUpdate(
    req.params.id,
    { $pull: { subjects: req.params.subjectId } },
    { new: true }
  );
  if (!cls) { res.status(404).json({ success: false, message: 'Class not found' }); return; }
  res.json({ success: true, data: cls });
}
