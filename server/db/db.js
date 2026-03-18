import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("📂 Connected to MongoDB Database");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    if (error.message.includes("bad auth")) {
      console.error("⚠️  Please check your MONGODB_URL in the .env file. Your Atlas credentials might be incorrect.");
    }
  }
};

export default connectToDatabase;