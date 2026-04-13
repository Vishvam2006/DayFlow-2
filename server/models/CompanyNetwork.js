import mongoose from "mongoose";
import net from "net";

const companyNetworkSchema = new mongoose.Schema(
  {
    officeName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    publicIP: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
      validate: {
        validator(value) {
          return Boolean(value && net.isIP(String(value).trim()));
        },
        message: "publicIP must be a valid public IP address",
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: 160,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastMatchedAt: {
      type: Date,
    },
  },
  { timestamps: true, strict: "throw" }
);

companyNetworkSchema.index({ officeName: 1 });
companyNetworkSchema.index({ publicIP: 1, isActive: 1 });

const CompanyNetwork = mongoose.model("CompanyNetwork", companyNetworkSchema);

export default CompanyNetwork;

