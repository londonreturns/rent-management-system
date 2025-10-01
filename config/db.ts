import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  const mongooseApiKey = process.env.MONGODB_URI;

  if (!mongooseApiKey) {
    throw new Error("MONGODB_URI is not defined in environment variables.");
  }

  try {
    await mongoose.connect(mongooseApiKey);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};
