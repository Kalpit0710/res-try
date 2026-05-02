"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const mongoUri_1 = require("./mongoUri");
async function connectDB() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('MONGO_URI is not defined in environment variables');
        }
        console.warn('⚠️  MONGO_URI not set — skipping MongoDB connection in non-production environment');
        return;
    }
    try {
        await mongoose_1.default.connect((0, mongoUri_1.normalizeMongoUri)(uri));
        console.log('✅  MongoDB connected');
    }
    catch (err) {
        console.error('❌  MongoDB connection failed:', err);
        if (process.env.NODE_ENV === 'production')
            process.exit(1);
    }
}
