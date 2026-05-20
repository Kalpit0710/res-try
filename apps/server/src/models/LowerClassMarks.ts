import { Schema, model, Document } from 'mongoose';

export interface ILowerClassMarks extends Document {
  studentId: Schema.Types.ObjectId;
  classId: Schema.Types.ObjectId;
  subjectId: Schema.Types.ObjectId;
  term1: Record<string, number>;
  term2: Record<string, number>;
}

const LowerClassMarksSchema = new Schema<ILowerClassMarks>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'LowerClassSubject', required: true },
    term1: { type: Map, of: Number, default: {} },
    term2: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

// Compound unique index: one marks doc per student+subject
LowerClassMarksSchema.index({ studentId: 1, subjectId: 1 }, { unique: true });

export const LowerClassMarks = model<ILowerClassMarks>('LowerClassMarks', LowerClassMarksSchema);
