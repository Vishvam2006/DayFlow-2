import mongoose from 'mongoose';

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
