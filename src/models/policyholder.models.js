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
      lowercase: true, // Fixed typo from "lowecase"
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
    // New field: an array to store claim IDs (references to Claim model)
    claims: [
      {
        type: Schema.Types.ObjectId,
        ref: "Claim",
      },
    ],
  },
  {
    timestamps: true, // Automatically creates "createdAt" and "updatedAt" fields
  }
);

// Pre-save hook to hash password if modified
policyHolderSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Instance method to compare password
policyHolderSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Instance method to generate an access token
policyHolderSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Instance method to generate a refresh token
policyHolderSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const policyHolder = mongoose.model("policyHolder", policyHolderSchema);
