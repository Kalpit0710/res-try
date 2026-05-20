import { Request, Response } from 'express';
import { LowerClassMarks } from '../models/LowerClassMarks';
import { LowerClassSubject } from '../models/LowerClassSubject';
import { Student } from '../models/Student';
import { Class } from '../models/Class';

export async function getLowerClassMarks(req: Request, res: Response): Promise<void> {
  try {
    const { studentId, classId, subjectId } = req.query;
    const filter: any = {};
    
    if (studentId) filter.studentId = studentId;
    if (classId) filter.classId = classId;
    if (subjectId) filter.subjectId = subjectId;
    
    const marks = await LowerClassMarks.find(filter)
      .populate('studentId', 'name rollNo regNo')
      .populate('classId', 'name')
      .populate('subjectId', 'name components')
      .lean();
    
    res.json({ success: true, data: marks });
  } catch (error) {
    console.error('Error fetching lower class marks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch marks' });
  }
}

export async function getLowerClassMarksByStudent(req: Request, res: Response): Promise<void> {
  try {
    const { studentId } = req.params;
    
    const marks = await LowerClassMarks.find({ studentId })
      .populate('subjectId', 'name components order')
      .sort({ 'subjectId.order': 1 })
      .lean();
    
    res.json({ success: true, data: marks });
  } catch (error) {
    console.error('Error fetching student marks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch marks' });
  }
}

export async function upsertLowerClassMarks(req: Request, res: Response): Promise<void> {
  try {
    const { studentId, classId, subjectId, term1, term2 } = req.body;
    
    // Validate student exists
    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }
    
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
    
    // Validate subject exists
    const subject = await LowerClassSubject.findById(subjectId);
    if (!subject) {
      res.status(404).json({ success: false, message: 'Subject not found' });
      return;
    }
    
    // Validate marks against max marks
    const componentMap = new Map(subject.components.map(c => [c.name, c.maxMarks]));
    
    const validateMarks = (marks: Record<string, number>) => {
      for (const [component, value] of Object.entries(marks)) {
        const maxMarks = componentMap.get(component);
        if (maxMarks === undefined) {
          res.status(400).json({ success: false, message: `Invalid component: ${component}` });
          return false;
        }
        if (typeof value !== 'number' || value < 0 || value > maxMarks) {
          res.status(400).json({ 
            success: false, 
            message: `Invalid marks for ${component}: must be between 0 and ${maxMarks}` 
          });
          return false;
        }
      }
      return true;
    };
    
    if (term1 && !validateMarks(term1)) return;
    if (term2 && !validateMarks(term2)) return;
    
    // Upsert marks
    const marks = await LowerClassMarks.findOneAndUpdate(
      { studentId, subjectId },
      {
        studentId,
        classId,
        subjectId,
        term1: term1 || {},
        term2: term2 || {},
      },
      { upsert: true, new: true }
    );
    
    res.json({ success: true, data: marks });
  } catch (error) {
    console.error('Error upserting lower class marks:', error);
    res.status(500).json({ success: false, message: 'Failed to save marks' });
  }
}

export async function bulkUpsertLowerClassMarks(req: Request, res: Response): Promise<void> {
  try {
    const { classId, marksData } = req.body;
    
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
    
    if (!marksData || !Array.isArray(marksData) || marksData.length === 0) {
      res.status(400).json({ success: false, message: 'Marks data array is required' });
      return;
    }
    
    // Get all subjects for this class
    const subjects = await LowerClassSubject.find({ classId }).lean();
    const subjectMap = new Map(subjects.map(s => [s._id.toString(), s]));
    
    const results = [];
    
    for (const markRecord of marksData) {
      const { studentId, subjectId, term1, term2 } = markRecord;
      
      // Validate student exists
      const student = await Student.findById(studentId);
      if (!student) {
        results.push({ success: false, studentId, message: 'Student not found' });
        continue;
      }
      
      // Validate subject exists
      const subject = subjectMap.get(subjectId);
      if (!subject) {
        results.push({ success: false, studentId, subjectId, message: 'Subject not found' });
        continue;
      }
      
      // Validate marks against max marks
      const componentMap = new Map(subject.components.map(c => [c.name, c.maxMarks]));
      
      const validateMarks = (marks: Record<string, number>) => {
        for (const [component, value] of Object.entries(marks)) {
          const maxMarks = componentMap.get(component);
          if (maxMarks === undefined) return false;
          if (typeof value !== 'number' || value < 0 || value > maxMarks) return false;
        }
        return true;
      };
      
      if (term1 && !validateMarks(term1)) {
        results.push({ success: false, studentId, subjectId, message: 'Invalid marks for term1' });
        continue;
      }
      
      if (term2 && !validateMarks(term2)) {
        results.push({ success: false, studentId, subjectId, message: 'Invalid marks for term2' });
        continue;
      }
      
      // Upsert marks
      const marks = await LowerClassMarks.findOneAndUpdate(
        { studentId, subjectId },
        {
          studentId,
          classId,
          subjectId,
          term1: term1 || {},
          term2: term2 || {},
        },
        { upsert: true, new: true }
      );
      
      results.push({ success: true, data: marks });
    }
    
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error bulk upserting lower class marks:', error);
    res.status(500).json({ success: false, message: 'Failed to save marks' });
  }
}

export async function deleteLowerClassMarks(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const marks = await LowerClassMarks.findByIdAndDelete(id);
    if (!marks) {
      res.status(404).json({ success: false, message: 'Marks not found' });
      return;
    }
    
    res.json({ success: true, message: 'Marks deleted successfully' });
  } catch (error) {
    console.error('Error deleting lower class marks:', error);
    res.status(500).json({ success: false, message: 'Failed to delete marks' });
  }
}

export async function getClassMarksSummary(req: Request, res: Response): Promise<void> {
  try {
    const { classId } = req.params;
    
    const marks = await LowerClassMarks.find({ classId })
      .populate('studentId', 'name rollNo regNo')
      .populate('subjectId', 'name components order')
      .lean();
    
    // Group by student
    const studentMap = new Map();
    
    for (const mark of marks) {
      const studentId = (mark.studentId as any)._id.toString();
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          student: mark.studentId,
          subjects: [],
        });
      }
      
      studentMap.get(studentId).subjects.push({
        subject: mark.subjectId,
        term1: mark.term1,
        term2: mark.term2,
      });
    }
    
    const summary = Array.from(studentMap.values());
    
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching class marks summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
}
