import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[bookmyorder DB] Connected to MongoDB Atlas: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[bookmyorder DB] Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
