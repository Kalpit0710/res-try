import { Schema, model, Document } from 'mongoose';

export interface ITeacher extends Document {
  name: string;
  classId?: Schema.Types.ObjectId;
}

const TeacherSchema = new Schema<ITeacher>(
  {
    name: { type: String, required: true, trim: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class' },
  },
  { timestamps: true }
);

TeacherSchema.index({ name: 1 });
TeacherSchema.index({ classId: 1 });

export const Teacher = model<ITeacher>('Teacher', TeacherSchema);
