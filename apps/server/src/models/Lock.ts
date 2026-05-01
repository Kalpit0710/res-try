import { Schema, model, Document } from 'mongoose';

export type LockType = 'system' | 'class' | 'student' | 'teacher';

export interface ILock extends Document {
  type: LockType;
  referenceId: string;
  isLocked: boolean;
  updatedAt?: Date;
}

const LockSchema = new Schema<ILock>(
  {
    type: { type: String, enum: ['system', 'class', 'student', 'teacher'], required: true },
    referenceId: { type: String, required: true },
    isLocked: { type: Boolean, default: true },
  },
  { timestamps: true }
);

LockSchema.index({ type: 1, referenceId: 1 }, { unique: true });

export const Lock = model<ILock>('Lock', LockSchema);
