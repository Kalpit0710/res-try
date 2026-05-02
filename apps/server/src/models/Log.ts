import { Schema, model, Document } from 'mongoose';

export interface ILog extends Document {
  teacherName: string;
  action: string;
  studentId?: Schema.Types.ObjectId;
  subjectId?: Schema.Types.ObjectId;
  timestamp: Date;
}

const LogSchema = new Schema<ILog>({
  teacherName: { type: String, required: true },
  action: { type: String, required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
  timestamp: { type: Date, default: Date.now },
});

LogSchema.index({ studentId: 1 });
LogSchema.index({ timestamp: -1 });

export const Log = model<ILog>('Log', LogSchema);
