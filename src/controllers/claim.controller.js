import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { PolicyProvider } from "../models/policyprovider.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { policyHolder } from "../models/policyholder.models.js";
import { Policy } from "../models/policy.models.js";
import { Claim } from "../models/claim.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


export const createClaim = asyncHandler(async (req, res) => {
  // Extract required fields from the request body
  const { policyId, claimAmount, claimDate, description } = req.body;

  // Validate required fields
  if (
    !policyId ||
    !claimAmount ||
    !claimDate ||
    !description ||
    description.trim() === ""
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Find the policy document and check claim amount limit
  const policy = await Policy.findById(policyId);
  if (!policy) {
    throw new ApiError(404, "Policy not found");
  }
  if (Number(claimAmount) > Number(policy.policyAmount)) {
    throw new ApiError(400, "Claim amount cannot exceed the policy amount");
  }

  // Validate required file uploads
  const accidentReportLocalPath = req.files?.accidentReport?.[0]?.path;
  const invoiceDocumentLocalPath = req.files?.invoiceDocument?.[0]?.path;
  if (!accidentReportLocalPath || !invoiceDocumentLocalPath) {
    throw new ApiError(
      400,
      "Accident report and invoice document are required"
    );
  }

  // Upload required files to Cloudinary
  const accidentReportUpload = await uploadOnCloudinary(
    accidentReportLocalPath
  );
  const invoiceDocumentUpload = await uploadOnCloudinary(
    invoiceDocumentLocalPath
  );
  if (!(accidentReportUpload && invoiceDocumentUpload)) {
    throw new ApiError(400, "File upload failed");
  }

  // Handle optional file uploads for photoEvidence and additionalDocuments
  let photoEvidenceUrls = [];
  if (req.files?.photoEvidence) {
    for (const file of req.files.photoEvidence) {
      const uploadResult = await uploadOnCloudinary(file.path);
      if (uploadResult && uploadResult.url) {
        photoEvidenceUrls.push(uploadResult.url);
      }
    }
  }

  

  // Create the claim document.
  // Also, set the policyProvider field using the policy's provider reference.
  const newClaim = await Claim.create({
    policyId,
    policyholderId: req.user._id, // Assumes req.user is set by your auth middleware
    claimAmount,
    claimDate,
    description,
    status: "Pending",
    accidentReport: accidentReportUpload.url,
    invoiceDocument: invoiceDocumentUpload.url,
    photoEvidence: photoEvidenceUrls,
    
    policyProvider: policy.policyProvider,
  });

  // Add the new claim's ID to the policy holder's "claims" array.
  await policyHolder.findByIdAndUpdate(req.user._id, {
    $push: { claims: newClaim._id },
  });

  // Add the new claim's ID to the policy provider's "claims" array.
  // Here, we assume the policy document has a field "policyProvider" that references the provider.
  await PolicyProvider.findByIdAndUpdate(policy.policyProvider, {
    $push: { claims: newClaim._id },
  });

  // Return the created claim in the response.
  return res
    .status(201)
    .json(new ApiResponse(200, newClaim, "Claim submitted successfully"));
});

export const getClaimById = asyncHandler(async (req, res) => {
  // Extract the claim ID from the request body
  const { claimId } = req.body;
  if (!claimId) {
    throw new ApiError(400, "Claim ID is required");
  }

  // Get the logged-in policy holder's ID from req.user (set by verifyJWT middleware)
  const policyHolderId = req.user?._id;
  if (!policyHolderId) {
    throw new ApiError(409, "User not found");
  }

  // Query the Claim model ensuring the claim belongs to this policy holder
  const claim = await Claim.findOne({
    _id: claimId,
    policyholderId: policyHolderId,
  });
  if (!claim) {
    throw new ApiError(
      404,
      "Claim not found or you are not authorized to access it"
    );
  }

  // If claim status is "Approved", fetch the policy amount from the Policy document
  if (claim.status === "Approved") {
    const policy = await Policy.findById(claim.policyId).select("policyAmount");
    // Convert the claim document to an object so we can add additional properties
    const result = claim.toObject();
    if (policy) {
      result.policyAmount = policy.policyAmount;
    }
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Claim fetched successfully"));
  }

  // Otherwise, return the claim as is
  return res
    .status(200)
    .json(new ApiResponse(200, claim, "Claim fetched successfully"));
});

export const getAllClaimsForHolder = asyncHandler(async (req, res) => {
  // Get the logged-in policy holder's ID from req.user
  const policyHolderId = req.user?._id;
  if (!policyHolderId) {
    throw new ApiError(409, "User not found");
  }

  // Find all claims associated with this policy holder
  const claims = await Claim.find({ policyholderId: policyHolderId }).sort({
    createdAt: -1,
  }); // Optionally sort claims by creation date (newest first)

  // Return the claims in a standardized response format
  return res
    .status(200)
    .json(new ApiResponse(200, claims, "Claims fetched successfully"));
});

export const approveClaim = asyncHandler(async (req, res) => {
  // Get the logged-in policy provider's ID (set by verifyJWT middleware)
  const policyProviderId = req.user?._id;
  if (!policyProviderId) {
    throw new ApiError(409, "User not found");
  }

  // Extract the claim ID from the request body
  const { claimId } = req.body;
  if (!claimId || claimId.trim() === "") {
    throw new ApiError(400, "Claim ID is required");
  }

  // Find the claim document
  const claim = await Claim.findById(claimId);
  if (!claim) {
    throw new ApiError(404, "Claim not found");
  }

  // Verify that the claim belongs to the logged-in policy provider
  if (claim.policyProvider.toString() !== policyProviderId.toString()) {
    throw new ApiError(403, "Unauthorized to approve this claim");
  }

  // Update the claim status to "Approved"
  claim.status = "Approved";
  await claim.save();

  // Remove the claim ID from the policy provider's 'claims' array
  await PolicyProvider.findByIdAndUpdate(policyProviderId, {
    $pull: { claims: claimId },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, claim, "Claim approved successfully"));
});

export const getProviderClaims = asyncHandler(async (req, res) => {
  // Retrieve the logged-in policy provider's ID from req.user (set by your authentication middleware)
  const providerId = req.user?._id;
  if (!providerId) {
    throw new ApiError(409, "User not found");
  }

  // Query the Claim collection to find all claims where the policyProvider field matches the logged-in provider
  const claims = await Claim.find({ policyProvider: providerId })
    .populate("policyholderId", "fullName email") // Optionally populate policy holder details
    .sort({ createdAt: -1 }); // Sort by creation date descending (newest first)

  return res
    .status(200)
    .json(new ApiResponse(200, claims, "Claims fetched successfully"));
});

