import { Schema, model, Document } from 'mongoose';

export interface ICoScholasticMarks extends Document {
  studentId: Schema.Types.ObjectId;
  area: string; // e.g., "Work Education", "Art Education"
  term1?: number;
  term2?: number;
}

const CoScholasticMarksSchema = new Schema<ICoScholasticMarks>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    area: { type: String, required: true }, // co-scholastic area name
    term1: { type: Number, min: 0, max: 100 },
    term2: { type: Number, min: 0, max: 100 },
  },
  { timestamps: true }
);

// Compound unique index: one doc per student+area
CoScholasticMarksSchema.index({ studentId: 1, area: 1 }, { unique: true });
CoScholasticMarksSchema.index({ studentId: 1 });

export const CoScholasticMarks = model<ICoScholasticMarks>('CoScholasticMarks', CoScholasticMarksSchema);
