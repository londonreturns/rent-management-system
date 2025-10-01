import { Mongoose } from "mongoose";

export const connectDB = async (mongoose: Mongoose, mongoURI: string) => {
  try {
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};