import { Schema, model, Document } from 'mongoose';

export interface IComponent {
  name: string;
  maxMarks: number;
}

export interface ILowerClassSubject extends Document {
  name: string;
  classId: Schema.Types.ObjectId;
  components: IComponent[];
  order: number;
}

const ComponentSchema = new Schema<IComponent>(
  {
    name: { type: String, required: true },
    maxMarks: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const LowerClassSubjectSchema = new Schema<ILowerClassSubject>(
  {
    name: { type: String, required: true, trim: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    components: { type: [ComponentSchema], required: true, default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

LowerClassSubjectSchema.index({ classId: 1, order: 1 });

export const LowerClassSubject = model<ILowerClassSubject>('LowerClassSubject', LowerClassSubjectSchema);
