import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { fileURLToPath } from "url";

import User, { E164_PHONE_NUMBER_REGEX } from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const MONGO_URL = process.env.MONGO_URI || process.env.MONGODB_URL;
const SHOULD_PROMPT = process.argv.includes("--prompt");
const DRY_RUN = process.argv.includes("--dry-run");
const DUMMY_COUNTRY_CODE = "+91";
const DUMMY_NUMBER_START = 9000000000;

const missingPhoneFilter = {
  role: "employee",
  $or: [
    { phoneNumber: { $exists: false } },
    { phoneNumber: null },
    { phoneNumber: "" },
  ],
};

const getNextDummyNumber = (usedPhoneNumbers) => {
  let offset = 0;
  let phoneNumber = `${DUMMY_COUNTRY_CODE}${DUMMY_NUMBER_START + offset}`;

  while (usedPhoneNumbers.has(phoneNumber)) {
    offset += 1;
    phoneNumber = `${DUMMY_COUNTRY_CODE}${DUMMY_NUMBER_START + offset}`;
  }

  usedPhoneNumbers.add(phoneNumber);
  return phoneNumber;
};

const promptForPhoneNumber = async (rl, employee, usedPhoneNumbers) => {
  while (true) {
    const answer = await rl.question(
      `Phone for ${employee.name} (${employee.email}); leave blank for dummy: `,
    );
    const phoneNumber = answer.trim();

    if (!phoneNumber) {
      return getNextDummyNumber(usedPhoneNumbers);
    }

    if (!E164_PHONE_NUMBER_REGEX.test(phoneNumber)) {
      console.log("Invalid E.164 phone number. Example: +91XXXXXXXXXX");
      continue;
    }

    if (usedPhoneNumbers.has(phoneNumber)) {
      console.log("That phone number is already used. Enter a unique number.");
      continue;
    }

    usedPhoneNumbers.add(phoneNumber);
    return phoneNumber;
  }
};

const run = async () => {
  if (!MONGO_URL) {
    throw new Error("Missing MONGO_URI or MONGODB_URL environment variable.");
  }

  let rl;

  try {
    // Backfill before MongoDB builds the new unique phoneNumber index.
    await mongoose.connect(MONGO_URL, { autoIndex: false });

    const employees = await User.find(missingPhoneFilter)
      .select("_id name email employeeId phoneNumber")
      .sort({ createdAt: 1, _id: 1 });

    if (employees.length === 0) {
      console.log("No employees are missing phoneNumber.");
      return;
    }

    const existingPhoneNumbers = new Set(
      (await User.distinct("phoneNumber", {
        phoneNumber: { $type: "string", $ne: "" },
      })).filter(Boolean),
    );

    if (SHOULD_PROMPT) {
      rl = readline.createInterface({ input, output });
    }

    for (const employee of employees) {
      const phoneNumber = SHOULD_PROMPT
        ? await promptForPhoneNumber(rl, employee, existingPhoneNumbers)
        : getNextDummyNumber(existingPhoneNumbers);

      console.log(
        `${DRY_RUN ? "Would update" : "Updating"} ${employee.email} -> ${phoneNumber}`,
      );

      if (!DRY_RUN) {
        employee.phoneNumber = phoneNumber;
        await employee.save();
      }
    }

    console.log(
      `${DRY_RUN ? "Dry run complete" : "Backfill complete"} for ${employees.length} employee(s).`,
    );
  } finally {
    if (rl) {
      rl.close();
    }
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error("Phone number backfill failed:", error.message);
  process.exit(1);
});
