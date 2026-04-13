import bcrypt from "bcrypt";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import connectToDatabase from "./db/db.js";

dotenv.config();

const userSeed = async () => {
  await connectToDatabase();
  try {
    // Clear existing users if any (optional, but good for clean seed)
    // await User.deleteMany({});

    const adminPassword = await bcrypt.hash("admin123", 10);
    const employeePassword = await bcrypt.hash("employee123", 10);

    const users = [
      {
        name: "Admin User",
        email: "admin@dayflow.com",
        phoneNumber: "+919200000000",
        password: adminPassword,
        role: "admin",
      },
      {
        name: "John Doe",
        email: "john@dayflow.com",
        phoneNumber: "+919200000001",
        password: employeePassword,
        role: "employee",
        jobTitle: "Software Developer",
        bio: "Full-stack developer with a passion for clean code.",
      },
      {
        name: "Jane Smith",
        email: "jane@dayflow.com",
        phoneNumber: "+919200000002",
        password: employeePassword,
        role: "employee",
        jobTitle: "UI/UX Designer",
        bio: "Designing beautiful and functional interfaces for over 5 years.",
      },
    ];

    for (let u of users) {
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        console.log(`⚠️ User ${u.email} already exists, skipping...`);
        continue;
      }
      const newUser = new User(u);
      await newUser.save();
      console.log(`✅ Seeded user: ${u.email} (${u.role})`);
    }

    console.log("📌 Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

userSeed();
