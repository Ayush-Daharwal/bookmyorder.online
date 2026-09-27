import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[bookmyorder DB] Connected to MongoDB Atlas: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[bookmyorder DB] Error connecting to Cloud MongoDB: ${error.message}`);
    // Attempt local MongoDB fallback
    try {
      const localUri = 'mongodb://127.0.0.1:27017/bookmyorder';
      console.log(`[bookmyorder DB] Attempting local MongoDB connection fallback...`);
      const conn = await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
      console.log(`[bookmyorder DB] Connected to Local MongoDB: ${conn.connection.host}`);
    } catch (localErr) {
      console.error(`[bookmyorder DB] Local DB fallback note: ${localErr.message}`);
      console.log(`[bookmyorder DB] Backend server remains ONLINE. Will retry cloud connection in 10s...`);
      setTimeout(connectDB, 10000);
    }
  }
};

export default connectDB;
