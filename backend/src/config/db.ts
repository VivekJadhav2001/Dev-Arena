import mongoose from "mongoose";
import { env } from "./env.js";
import dotenv from "dotenv";
dotenv.config();
let isConnected = false;

async function connectDB() {
  if (isConnected) {
    console.log("MongoDB already connected");
    return;
  }

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

export async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log("MongoDB disconnected");
}

export function getConnectionStatus() {
  return {
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
}


export default connectDB