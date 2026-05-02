import { Schema, model, Document } from 'mongoose';

export interface ITeacher extends Document {
  name: string;
}

const TeacherSchema = new Schema<ITeacher>(
  {
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

TeacherSchema.index({ name: 1 });

export const Teacher = model<ITeacher>('Teacher', TeacherSchema);
