import { Schema, model, Document } from 'mongoose';

export interface IStudent extends Document {
  regNo: string;
  name: string;
  fatherName?: string;
  motherName?: string;
  dob?: Date;
  classId: Schema.Types.ObjectId;
  rollNo?: string;
}

const StudentSchema = new Schema<IStudent>(
  {
    regNo: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    dob: { type: Date },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    rollNo: { type: String, trim: true },
  },
  { timestamps: true }
);

StudentSchema.index({ classId: 1 });
StudentSchema.index({ name: 'text', regNo: 'text' });

export const Student = model<IStudent>('Student', StudentSchema);
