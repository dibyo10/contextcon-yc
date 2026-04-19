import mongoose from 'mongoose';
import { logInfo } from '../utils/errorLogger.js';

export async function connectDB(){
    logInfo("mongo", "Connecting to MongoDB.", {
        hasMongoUri: Boolean(process.env.MONGO_URI),
    });
    await mongoose.connect(process.env.MONGO_URI);
    logInfo("mongo", "MongoDB connected.");
}
