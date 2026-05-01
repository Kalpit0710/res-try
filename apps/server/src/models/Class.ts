import { Schema, model, Document } from 'mongoose';

export interface IClass extends Document {
  name: string;
  subjects: Schema.Types.ObjectId[];
}

const ClassSchema = new Schema<IClass>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
  },
  { timestamps: true }
);

export const Class = model<IClass>('Class', ClassSchema);
