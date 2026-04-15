import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectToDatabase = async () => {
  if (!process.env.MONGODB_URL?.trim()) {
    throw new Error("Missing MONGODB_URL.");
  }

  const maskedUrl = process.env.MONGODB_URL
    ? process.env.MONGODB_URL.replace(/:([^@]+)@/, ":****@")
    : "undefined";

  console.log(`🔌 Attempting to connect to MongoDB: ${maskedUrl}`);

  try {
    // Set a timeout to avoid hanging indefinitely if DNS/Network is down
    await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("📂 Connected to MongoDB Database");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    if (error.message.includes("bad auth") || error.message.includes("Authentication failed")) {
      console.error("⚠️  Please check your MONGODB_URL credentials in the .env file.");
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("EAI_AGAIN")) {
      console.error("🌐 DNS lookup failed. The hostname in your MONGODB_URL might be incorrect.");
    } else if (error.message.includes("ETIMEDOUT") || error.message.includes("connection timed out")) {
      console.error("⏳ Connection timed out. Please check your IP whitelist in MongoDB Atlas.");
    }

    throw error;
  }
};

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose Connection Error Event:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("🔌 Mongoose Disconnected.");
});

export default connectToDatabase;
