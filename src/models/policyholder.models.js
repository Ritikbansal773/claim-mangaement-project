import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const policyHolderSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // Ensures username is stored in lowercase
      trim: true, // Removes leading/trailing whitespace
      index: true, // Creates an index for faster queries
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowecase: true, // <-- Note: There is a typo here; it should be "lowercase"
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    identityProof: {
      type: String, // Expected to be a Cloudinary URL or similar reference
      required: true,
    },
    ageProof: {
      type: String, // Expected to be a Cloudinary URL or similar reference
      required: true,
    },
    policy_Id: [
      {
        type: Schema.Types.ObjectId,
        ref: "Policy", // References the Policy model, creating a relationship
      },
    ],
    addressProof: {
      type: String, // Expected to be a Cloudinary URL or similar reference
      required: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String, // Used for storing refresh tokens for authentication
    },
  },
  {
    timestamps: true, // Automatically creates "createdAt" and "updatedAt" fields
  }
);

export const policyHolder = mongoose.model("policyHolder", policyHolderSchema);