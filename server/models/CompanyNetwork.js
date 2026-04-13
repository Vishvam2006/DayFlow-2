import mongoose from "mongoose";

const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

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
      match: [IPV4_REGEX, "publicIP must be a valid IPv4 address"],
    },
  },
  { timestamps: true, strict: "throw" }
);

companyNetworkSchema.index({ officeName: 1 });

const CompanyNetwork = mongoose.model("CompanyNetwork", companyNetworkSchema);

export default CompanyNetwork;

