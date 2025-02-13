import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const policySchema = new Schema(
  {
    // The name of the policy. Stored as a lowercase, trimmed string for consistency.
    policyName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // The type of policy. Not marked as unique so that multiple policies of the same type can exist.
    policyType: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    // Detailed information about what the policy covers.
    coverageDetail: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    // The monetary limit of the coverage. Stored as a Number for easy calculations.
    coverageLimit: {
      type: Number,
      required: true,
    },
    // The overall policy amount (e.g., the premium or total insured amount). Stored as a Number.
    policyAmount: {
      type: Number,
      required: true,
    },
    // The duration of the policy (for example, in months). You can change the unit as needed.
    policyDuration: {
      type: Number,
      required: true,
    },
    // The date when the policy becomes effective. Stored as a Date.
    effectiveDate: {
      type: Date,
      required: [true, "Effective date is required"],
    },
    // The end date of the policy. Stored as a Date.
    endDate: {
      type: Date,
      required: true,
    },
    // Optional field for storing a refresh token or similar authentication token.
    refreshToken: {
      type: String,
    },
    // If you need to reference other related documents (e.g., from a different collection),
    // you can use an array of ObjectIds. Update the ref value as needed.
    policyProvider: [
      {
        type: Schema.Types.ObjectId,
        ref: "PolicyProvider", // Replace "SomeRef" with the actual model name you want to reference
      },
    ],
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt timestamps
  }
);

export const Policy = mongoose.model(
  "Policy",
  policySchema
);
