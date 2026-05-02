import { Schema, model, Document } from 'mongoose';

const TermMarksSchema = {
  periodicTest: { type: Number, min: 0 },
  notebook: { type: Number, min: 0 },
  subEnrichment: { type: Number, min: 0 },
};

export interface IMarks extends Document {
  studentId: Schema.Types.ObjectId;
  subjectId: Schema.Types.ObjectId;
  teacherName: string;
  term1: {
    periodicTest?: number;
    notebook?: number;
    subEnrichment?: number;
    halfYearlyExam?: number;
  };
  term2: {
    periodicTest?: number;
    notebook?: number;
    subEnrichment?: number;
    yearlyExam?: number;
  };
}

const MarksSchema = new Schema<IMarks>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacherName: { type: String, required: true },
    term1: {
      ...TermMarksSchema,
      halfYearlyExam: { type: Number, min: 0 },
    },
    term2: {
      ...TermMarksSchema,
      yearlyExam: { type: Number, min: 0 },
    },
  },
  { timestamps: true }
);

// Compound unique index: one marks doc per student+subject
MarksSchema.index({ studentId: 1, subjectId: 1 }, { unique: true });
MarksSchema.index({ studentId: 1 });

export const Marks = model<IMarks>('Marks', MarksSchema);
