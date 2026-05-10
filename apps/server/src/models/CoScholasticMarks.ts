import { Schema, model, Document } from 'mongoose';

export interface ICoScholasticMarks extends Document {
  studentId: Schema.Types.ObjectId;
  area: string; // e.g., "Work Education", "Art Education"
  term1?: string;
  term2?: string;
}

const CoScholasticMarksSchema = new Schema<ICoScholasticMarks>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    area: { type: String, required: true }, // co-scholastic area name
    term1: { type: String, trim: true },
    term2: { type: String, trim: true },
  },
  { timestamps: true }
);

// Compound unique index: one doc per student+area (studentId:1 prefix covers standalone studentId queries too)
CoScholasticMarksSchema.index({ studentId: 1, area: 1 }, { unique: true });

export const CoScholasticMarks = model<ICoScholasticMarks>('CoScholasticMarks', CoScholasticMarksSchema);
