import mongoose, { Schema } from "mongoose";

const claimSchema = new Schema(
  {
    // Reference to the Policy related to the claim
    policyId: {
      type: Schema.Types.ObjectId,
      ref: "Policy",
      required: true,
    },
    // Reference to the PolicyHolder making the claim
    policyholderId: {
      type: Schema.Types.ObjectId,
      ref: "policyHolder",
      required: true,
    },
    // NEW: Reference to the PolicyProvider associated with this claim
    policyProvider: {
      type: Schema.Types.ObjectId,
      ref: "PolicyProvider",
      required: true,
    },
    // The amount being claimed
    claimAmount: {
      type: Number,
      required: true,
    },
    // The date the claim was submitted
    claimDate: {
      type: Date,
      required: true,
    },
    // A detailed description of the claim
    description: {
      type: String,
      required: true,
      trim: true,
    },
    // The current status of the claim (e.g., Pending, Approved, Rejected)
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      required: true,
    },
    // URL for the accident or incident report document
    accidentReport: {
      type: String,
    },
    // URL for the invoice or repair estimate document
    invoiceDocument: {
      type: String,
    },
    // Array of URLs for photo evidence
    photoEvidence: [
      {
        type: String,
      },
    ],
    
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

export const Claim = mongoose.model("Claim", claimSchema);
