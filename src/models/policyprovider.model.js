import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const policyProviderSchema = new Schema(
  {
    // Name of the company offering the policies.
    companyName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Contact email of the company.
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // corrected spelling
      trim: true,
    },
    // Brand name or trading name of the company.
    brandName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    // URL to a document/image that proves the company's legitimacy (e.g., stored on Cloudinary).
    companyProof: {
      type: String, // cloudinary url
      required: true,
    },
    // URL to the company's license document.
    license: {
      type: String, // cloudinary url
      required: true,
    },
    // Linking the policies provided by this provider.
    // This is an array of ObjectIds referencing documents in the "Policy" collection.
    policy_Id: [
      {
        type: Schema.Types.ObjectId,
        ref: "Policy",
      },
    ],
    // New field to indicate what types of policies are offered.
    // For example, it could include ["auto", "health", "home"].
    policyTypes: {
      type: [String],
      required: true,
      default: [],
    },
    // URL to a document/image that proves the company's address.
    addressProof: {
      type: String, // cloudinary url
      required: true,
    },
    // Company account password.
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    // Field to store refresh token for authentication (if applicable).
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields.
  }
);


policyProviderSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

policyProviderSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

policyProviderSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.companyName,
      fullName: this.brandName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
policyProviderSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const PolicyProvider = mongoose.model(
  "PolicyProvider",
  policyProviderSchema
);
