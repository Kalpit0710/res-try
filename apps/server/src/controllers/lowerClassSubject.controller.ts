import { Request, Response } from 'express';
import { LowerClassSubject } from '../models/LowerClassSubject';
import { Class } from '../models/Class';

export async function getLowerClassSubjects(req: Request, res: Response): Promise<void> {
  try {
    const { classId } = req.query;
    const filter: any = {};
    if (classId) {
      filter.classId = classId;
    }
    
    const subjects = await LowerClassSubject.find(filter)
      .populate('classId', 'name')
      .sort({ order: 1, name: 1 })
      .lean();
    
    res.json({ success: true, data: subjects });
  } catch (error) {
    console.error('Error fetching lower class subjects:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subjects' });
  }
}

export async function getLowerClassSubjectById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const subject = await LowerClassSubject.findById(id)
      .populate('classId', 'name')
      .lean();
    
    if (!subject) {
      res.status(404).json({ success: false, message: 'Subject not found' });
      return;
    }
    
    res.json({ success: true, data: subject });
  } catch (error) {
    console.error('Error fetching lower class subject:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subject' });
  }
}

export async function createLowerClassSubject(req: Request, res: Response): Promise<void> {
  try {
    const { name, classId, components, order } = req.body;
    
    // Validate class exists and is lowerClass type
    const cls = await Class.findById(classId);
    if (!cls) {
      res.status(404).json({ success: false, message: 'Class not found' });
      return;
    }
    
    if (cls.reportCardType !== 'lowerClass') {
      res.status(400).json({ success: false, message: 'Class must be of lowerClass type' });
      return;
    }
    
    // Validate components
    if (!components || !Array.isArray(components)) {
      res.status(400).json({ success: false, message: 'Components array is required' });
      return;
    }
    
    for (const comp of components) {
      if (!comp.name || typeof comp.maxMarks !== 'number' || comp.maxMarks < 0) {
        res.status(400).json({ success: false, message: 'Each component must have name and valid maxMarks' });
        return;
      }
    }
    
    const subject = await LowerClassSubject.create({
      name,
      classId,
      components,
      order: order || 0,
    });
    
    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    console.error('Error creating lower class subject:', error);
    res.status(500).json({ success: false, message: 'Failed to create subject' });
  }
}

export async function updateLowerClassSubject(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, components, order } = req.body;
    
    const subject = await LowerClassSubject.findById(id);
    if (!subject) {
      res.status(404).json({ success: false, message: 'Subject not found' });
      return;
    }
    
    // Validate components if provided
    if (components) {
      if (!Array.isArray(components)) {
        res.status(400).json({ success: false, message: 'Components array is required' });
        return;
      }
      
      for (const comp of components) {
        if (!comp.name || typeof comp.maxMarks !== 'number' || comp.maxMarks < 0) {
          res.status(400).json({ success: false, message: 'Each component must have name and valid maxMarks' });
          return;
        }
      }
    }
    
    if (name) subject.name = name;
    if (components) subject.components = components;
    if (order !== undefined) subject.order = order;
    
    await subject.save();
    
    res.json({ success: true, data: subject });
  } catch (error) {
    console.error('Error updating lower class subject:', error);
    res.status(500).json({ success: false, message: 'Failed to update subject' });
  }
}

export async function deleteLowerClassSubject(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const subject = await LowerClassSubject.findByIdAndDelete(id);
    if (!subject) {
      res.status(404).json({ success: false, message: 'Subject not found' });
      return;
    }
    
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting lower class subject:', error);
    res.status(500).json({ success: false, message: 'Failed to delete subject' });
  }
}

export async function bulkCreateLowerClassSubjects(req: Request, res: Response): Promise<void> {
  try {
    const { classId, subjects } = req.body;
    
    // Validate class exists and is lowerClass type
    const cls = await Class.findById(classId);
    if (!cls) {
      res.status(404).json({ success: false, message: 'Class not found' });
      return;
    }
    
    if (cls.reportCardType !== 'lowerClass') {
      res.status(400).json({ success: false, message: 'Class must be of lowerClass type' });
      return;
    }
    
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      res.status(400).json({ success: false, message: 'Subjects array is required' });
      return;
    }
    
    // Validate each subject
    for (const subj of subjects) {
      if (!subj.name || !subj.components || !Array.isArray(subj.components)) {
        res.status(400).json({ success: false, message: 'Each subject must have name and components array' });
        return;
      }
      
      for (const comp of subj.components) {
        if (!comp.name || typeof comp.maxMarks !== 'number' || comp.maxMarks < 0) {
          res.status(400).json({ success: false, message: 'Each component must have name and valid maxMarks' });
          return;
        }
      }
    }
    
    // Delete existing subjects for this class
    await LowerClassSubject.deleteMany({ classId });
    
    // Create new subjects
    const createdSubjects = await LowerClassSubject.insertMany(
      subjects.map((subj: any, index: number) => ({
        name: subj.name,
        classId,
        components: subj.components,
        order: subj.order ?? index,
      }))
    );
    
    res.status(201).json({ success: true, data: createdSubjects });
  } catch (error) {
    console.error('Error bulk creating lower class subjects:', error);
    res.status(500).json({ success: false, message: 'Failed to create subjects' });
  }
}
