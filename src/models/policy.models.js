import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const policySchema = new Schema(
  {
    policyName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    policyType: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    coverageDetail: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    coverageLimit: {
      type: Number,
      required: true,
    },
    policyAmount: {
      type: Number,
      required: true,
    },
    policyDuration: {
      type: Number,
      required: true,
    },
    effectiveDate: {
      type: Date,
      required: [true, "Effective date is required"],
    },
    endDate: {
      type: Date,
      required: true,
    },
    certificateOfInsurance: {
      type: String, // Cloudinary URL or file path
      required: true,
    },
    termsAndConditions: {
      type: String, // Cloudinary URL or file path
      required: true,
    },
    refreshToken: {
      type: String,
    },
    policyProvider: [
      {
        type: Schema.Types.ObjectId,
        ref: "PolicyProvider",
      },
    ],
    policyHolders: [
      {
        type: Schema.Types.ObjectId,
        ref: "PolicyHolder", // Reference to policyholders who have taken this policy
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Policy = mongoose.model("Policy", policySchema);
