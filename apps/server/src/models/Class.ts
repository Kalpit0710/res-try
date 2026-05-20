import { Schema, model, Document } from 'mongoose';

export type ReportCardType = 'standard' | 'lowerClass';

export interface IClass extends Document {
  name: string;
  subjects: Schema.Types.ObjectId[];
  reportCardType: ReportCardType;
}

const ClassSchema = new Schema<IClass>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    reportCardType: { type: String, enum: ['standard', 'lowerClass'], default: 'standard' },
  },
  { timestamps: true }
);

export const Class = model<IClass>('Class', ClassSchema);
