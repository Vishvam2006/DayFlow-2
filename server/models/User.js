import mongoose from 'mongoose';

export const E164_PHONE_NUMBER_REGEX = /^\+[1-9]\d{1,14}$/;

const salaryStructureSchema = new mongoose.Schema(
  {
    basicSalary: { type: Number, default: 0, min: 0 },
    hra: { type: Number, default: 0, min: 0 },
    allowances: { type: Number, default: 0, min: 0 },
    bonus: { type: Number, default: 0, min: 0 },
    taxDeduction: { type: Number, default: 0, min: 0 },
    pfDeduction: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [
            E164_PHONE_NUMBER_REGEX,
            "Phone number must be in E.164 format (e.g., +91XXXXXXXXXX)",
        ],
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["admin", "employee"],
        required: true,
    },
    profileImage: String,
    jobTitle: { type: String, default: "" },
    bio: { type: String, default: "" },
    department: { type: String, default: "" },
    employeeId: { type: String, default: "" },
    salaryStructure: {
        type: salaryStructureSchema,
        default: () => ({}),
    },
}, { timestamps: true });


const User = mongoose.model("User", userSchema);

export default User;
