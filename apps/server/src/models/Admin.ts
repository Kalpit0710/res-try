import { Schema, model, Document } from 'mongoose';

export interface IAdmin extends Document {
  username: string;
  passwordHash: string;
}

const AdminSchema = new Schema<IAdmin>(
  {
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const Admin = model<IAdmin>('Admin', AdminSchema);
