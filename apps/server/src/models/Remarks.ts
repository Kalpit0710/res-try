import { Schema, model, Document } from 'mongoose';

export interface IRemark extends Document {
  studentId: Schema.Types.ObjectId;
  teacherName?: string;
  text: string;
}

const RemarkSchema = new Schema<IRemark>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
    teacherName: { type: String, trim: true },
    text: { type: String, trim: true },
  },
  { timestamps: true }
);

RemarkSchema.index({ studentId: 1 }, { unique: true });

export const Remark = model<IRemark>('Remark', RemarkSchema);
