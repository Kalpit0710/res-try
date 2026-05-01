import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    console.warn('⚠️  MONGO_URI not set — skipping MongoDB connection in non-production environment');
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('✅  MongoDB connected');
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  }
}
