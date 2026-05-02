import { Schema, model, Document } from 'mongoose';

const ComponentMarks = {
  periodicTest: { type: Number, default: 10 },
  notebook: { type: Number, default: 5 },
  subEnrichment: { type: Number, default: 5 },
};

export interface ISubject extends Document {
  name: string;
  classId: Schema.Types.ObjectId;
  maxMarks: {
    term1: { periodicTest: number; notebook: number; subEnrichment: number; halfYearlyExam: number };
    term2: { periodicTest: number; notebook: number; subEnrichment: number; yearlyExam: number };
  };
}

const SubjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true, trim: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    maxMarks: {
      term1: {
        ...ComponentMarks,
        halfYearlyExam: { type: Number, default: 30 },
      },
      term2: {
        ...ComponentMarks,
        yearlyExam: { type: Number, default: 30 },
      },
    },
  },
  { timestamps: true }
);

SubjectSchema.index({ classId: 1 });

export const Subject = model<ISubject>('Subject', SubjectSchema);
