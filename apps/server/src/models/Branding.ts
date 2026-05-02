import { Schema, model, Document } from 'mongoose';

interface ITeacherSignature {
  teacherId: string;
  teacherName: string;
  signatureUrl: string;
}

export interface IBranding extends Document {
  key: 'singleton';
  logoUrl?: string;
  principalSignatureUrl?: string;
  teacherSignatures: ITeacherSignature[];
}

const BrandingSchema = new Schema<IBranding>(
  {
    key: { type: String, required: true, unique: true, default: 'singleton' },
    logoUrl: { type: String },
    principalSignatureUrl: { type: String },
    teacherSignatures: {
      type: [
        {
          teacherId: { type: String, required: true },
          teacherName: { type: String, required: true },
          signatureUrl: { type: String, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const Branding = model<IBranding>('Branding', BrandingSchema);
