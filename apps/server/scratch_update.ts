import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Subject } from './src/models/Subject';

dotenv.config();

async function run() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const result = await Subject.updateMany({}, {
      $set: {
        'maxMarks.term1.periodicTest': 20,
        'maxMarks.term1.notebook': 5,
        'maxMarks.term1.subEnrichment': 5,
        'maxMarks.term1.halfYearlyExam': 70,
        'maxMarks.term2.periodicTest': 20,
        'maxMarks.term2.notebook': 5,
        'maxMarks.term2.subEnrichment': 5,
        'maxMarks.term2.yearlyExam': 70
      }
    });

    console.log(`Updated ${result.modifiedCount} subjects`);
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
