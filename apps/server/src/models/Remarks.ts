import { Schema, model, Document } from 'mongoose';

export interface IRemark extends Document {
  studentId: Schema.Types.ObjectId;
  teacherName?: string;
  remark?: string;
  term1?: {
    attendance?: string;
    remark?: string;
  };
  term2?: {
    attendance?: string;
    remark?: string;
  };
}

const RemarkSchema = new Schema<IRemark>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
    teacherName: { type: String, trim: true },
    remark: { type: String, trim: true },
    term1: {
      attendance: { type: String, trim: true },
      remark: { type: String, trim: true }
    },
    term2: {
      attendance: { type: String, trim: true },
      remark: { type: String, trim: true }
    }
  },
  { timestamps: true }
);

RemarkSchema.index({ studentId: 1 }, { unique: true });

export const Remark = model<IRemark>('Remark', RemarkSchema);
