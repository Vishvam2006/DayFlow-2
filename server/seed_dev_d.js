import bcrypt from "bcrypt";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import connectToDatabase from "./db/db.js";

dotenv.config();

const seedDevD = async () => {
  try {
    await connectToDatabase();
    
    const password = await bcrypt.hash("password123", 10);

    const usersToSeed = [
      {
        name: "dev d",
        email: "devd@dayflow.com",
        phoneNumber: "+917573019573",
        password: password,
        role: "employee",
        jobTitle: "Developer",
        department: "Engineering",
        employeeId: "EMP" + Math.floor(1000 + Math.random() * 9000),
      },
      {
        name: "Alice Smith",
        email: "alice@dayflow.com",
        phoneNumber: "+919876543210",
        password: password,
        role: "employee",
        jobTitle: "Product Manager",
        department: "Marketing",
        employeeId: "EMP" + Math.floor(1000 + Math.random() * 9000),
      },
      {
        name: "Bob Johnson",
        email: "bob@dayflow.com",
        phoneNumber: "+919876543211",
        password: password,
        role: "employee",
        jobTitle: "Sales Lead",
        department: "Sales",
        employeeId: "EMP" + Math.floor(1000 + Math.random() * 9000),
      },
      {
        name: "Charlie Brown",
        email: "charlie@dayflow.com",
        phoneNumber: "+919876543212",
        password: password,
        role: "employee",
        jobTitle: "HR Specialist",
        department: "Human Resources",
        employeeId: "EMP" + Math.floor(1000 + Math.random() * 9000),
      }
    ];

    for (const userData of usersToSeed) {
      const existingUser = await User.findOne({ 
        $or: [
          { email: userData.email },
          { phoneNumber: userData.phoneNumber }
        ] 
      });

      if (existingUser) {
        console.log(`⚠️ User with email ${userData.email} or phone ${userData.phoneNumber} already exists. Skipping...`);
      } else {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Successfully seeded user: ${userData.name} (${userData.phoneNumber})`);
      }
    }

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

seedDevD();
