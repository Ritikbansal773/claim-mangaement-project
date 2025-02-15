import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { PolicyProvider } from "../models/policyprovider.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { policyHolder } from "../models/policyholder.models.js";
import { Policy } from "../models/policy.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const createpolicy = asyncHandler(async (req, res) => {


let policyProvider = req.user?._id;

if (!policyProvider) {
  throw new ApiError(409, "User not found");
}


  const {
    policyName,
    policyType,
    coverageLimit,
    policyAmount,
    policyDuration,
    effectiveDate,
    endDate,
  } = req.body;


  if (
    [policyName, policyType].some((field) => field?.trim() === "") ||
    coverageLimit == null  ||
    policyAmount == null ||
    policyDuration == null ||
    effectiveDate== null ||
    endDate==null
  ) {
    throw new ApiError(400, "All fields are required");
  }

  
 

  const coverageDetailLocalPath = req.files?.coverageDetail[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;
  const certificateOfInsuranceLocalPath = req.files?.certificateOfInsurance[0]?.path;
  const termsAndConditionsLocalPath = req.files?.termsAndConditions[0]?.path;
  console.log(coverageDetailLocalPath);

  if (
    !(
      coverageDetailLocalPath &&
      termsAndConditionsLocalPath &&
      certificateOfInsuranceLocalPath
    )
  ) {
    throw new ApiError(400, "All file is required");
  }

  const coverageDetail = await uploadOnCloudinary(coverageDetailLocalPath);
  const certificateOfInsurance = await uploadOnCloudinary(certificateOfInsuranceLocalPath);
  const termsAndConditions = await uploadOnCloudinary(termsAndConditionsLocalPath);

  if (!(coverageDetail && certificateOfInsurance && termsAndConditions)) {
    throw new ApiError(400, "all file is required");
  }
  console.log(policyProvider);
  const policycreated = await Policy.create({
    coverageDetail: coverageDetail.url,
    certificateOfInsurance: certificateOfInsurance?.url || "",
    termsAndConditions: termsAndConditions?.url || "",
    policyName,
    policyType,
    coverageLimit,
    policyAmount,
    policyDuration,
    effectiveDate,
    endDate,
    policyProvider,
  });

  const createdpolicy = await Policy.findById(policycreated._id).select(
    "-password -refreshToken"
  );

  if (!createdpolicy) {
    throw new ApiError(500, "Something went wrong while registering the policy");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        createdpolicy,
        "policy registered Successfully"
      )
    );
});

const addpolicy = asyncHandler(async (req, res) => {
  
const policyholder = await policyHolder.findById(req.user?._id);
  if (!policyholder) {
    throw new ApiError(409, "User not found");
  }

  const {
     policy_Id
  } = req.body;

  if ([ policy_Id].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const policyad = await Policy.findById(policy_Id).select(
    "-password -refreshToken"
  );

  policyad.policyHolders.push(req.user?._id);
   await policyad.save({ validateBeforeSave: false });

    policyholder.policy_Id.push(policy_Id);
    await policyholder.save({ validateBeforeSave: false });

  const hol = await policyHolder
    .findById(req.user?._id)
    .select(" -refreshToken");

  if (!hol) {
    throw new ApiError(
      500,
      "Something went wrong while registering the policy"
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(200, hol, "policy added Successfully"));
});


export const getAllPolicies = asyncHandler(async (req, res, next) => {
  // Retrieve all policies from the database
  const policies = await Policy.find().populate("policyProvider");

  if (!policies) {
    // In case there is an unexpected error (though find() should return an empty array if none exist)
    throw new ApiError(404, "No policies found");
  }

  // Return a successful response with the policies array
  return res
    .status(200)
    .json(new ApiResponse(200, policies, "Policies fetched successfully"));
});



export const updatePolicy = asyncHandler(async (req, res) => {
  // Get the logged-in policy provider from req.user
  const policyProvider = req.user?._id;
  if (!policyProvider) {
    throw new ApiError(409, "User not found");
  }

  // Get policyId from the request body instead of params
  const {
    policyId,
    policyName,
    policyType,
    coverageLimit,
    policyAmount,
    policyDuration,
    effectiveDate,
    endDate,
  } = req.body;

  if (!policyId) {
    throw new ApiError(400, "Policy ID is required");
  }

  // Find the policy by ID
  const existingPolicy = await Policy.findById(policyId);
  if (!existingPolicy) {
    throw new ApiError(404, "Policy not found");
  }

  // Verify that the policy belongs to the logged-in policy provider
  if (existingPolicy.policyProvider.toString() !== policyProvider.toString()) {
    throw new ApiError(403, "Unauthorized to update this policy");
  }

  // Update only the provided fields
  if (policyName && policyName.trim() !== "")
    existingPolicy.policyName = policyName.trim();
  if (policyType && policyType.trim() !== "")
    existingPolicy.policyType = policyType.trim();
  if (coverageLimit != null) existingPolicy.coverageLimit = coverageLimit;
  if (policyAmount != null) existingPolicy.policyAmount = policyAmount;
  if (policyDuration != null) existingPolicy.policyDuration = policyDuration;
  if (effectiveDate) existingPolicy.effectiveDate = effectiveDate;
  if (endDate) existingPolicy.endDate = endDate;

  // Check for file updates; if new files are provided, upload and update the respective fields

  // Update coverageDetail if a new file is provided
  if (req.files?.coverageDetail && req.files.coverageDetail[0]) {
    const coverageDetailLocalPath = req.files.coverageDetail[0].path;
    const coverageDetail = await uploadOnCloudinary(coverageDetailLocalPath);
    if (coverageDetail && coverageDetail.url) {
      existingPolicy.coverageDetail = coverageDetail.url;
    }
  }

  // Update certificateOfInsurance if a new file is provided
  if (
    req.files?.certificateOfInsurance &&
    req.files.certificateOfInsurance[0]
  ) {
    const certificateOfInsuranceLocalPath =
      req.files.certificateOfInsurance[0].path;
    const certificateOfInsurance = await uploadOnCloudinary(
      certificateOfInsuranceLocalPath
    );
    if (certificateOfInsurance && certificateOfInsurance.url) {
      existingPolicy.certificateOfInsurance = certificateOfInsurance.url;
    }
  }

  // Update termsAndConditions if a new file is provided
  if (req.files?.termsAndConditions && req.files.termsAndConditions[0]) {
    const termsAndConditionsLocalPath = req.files.termsAndConditions[0].path;
    const termsAndConditions = await uploadOnCloudinary(
      termsAndConditionsLocalPath
    );
    if (termsAndConditions && termsAndConditions.url) {
      existingPolicy.termsAndConditions = termsAndConditions.url;
    }
  }

  // Save the updated policy
  await existingPolicy.save();

  // Retrieve the updated policy (excluding sensitive fields)
  const updatedPolicy = await Policy.findById(policyId).select(
    "-password -refreshToken"
  );
  if (!updatedPolicy) {
    throw new ApiError(500, "Something went wrong while updating the policy");
  }

  return res
    .status(200)
    .json({
      success: true,
      data: updatedPolicy,
      message: "Policy updated successfully",
    });
});



export const removePolicy = asyncHandler(async (req, res) => {
  // Find the logged-in policy holder
  const policyholder = await policyHolder.findById(req.user?._id);
  if (!policyholder) {
    throw new ApiError(409, "User not found");
  }

  // Extract policy_Id from the request body
  const { policy_Id } = req.body;
  if ([policy_Id].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // Find the policy document using policy_Id
  const policyDoc = await Policy.findById(policy_Id).select(
    "-password -refreshToken"
  );
  if (!policyDoc) {
    throw new ApiError(404, "Policy not found");
  }

  // Remove the logged-in user's ID from the policy's policyHolders array
  policyDoc.policyHolders = policyDoc.policyHolders.filter(
    (holderId) => holderId.toString() !== req.user._id.toString()
  );
  await policyDoc.save({ validateBeforeSave: false });

  // Remove the policy_Id from the policy holder's policy_Id array
  policyholder.policy_Id = policyholder.policy_Id.filter(
    (id) => id.toString() !== policy_Id.toString()
  );
  await policyholder.save({ validateBeforeSave: false });

  // Retrieve updated policy holder document (excluding sensitive fields)
  const updatedPolicyHolder = await policyHolder
    .findById(req.user._id)
    .select("-refreshToken");
  if (!updatedPolicyHolder) {
    throw new ApiError(500, "Something went wrong while removing the policy");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPolicyHolder, "Policy removed successfully")
    );
});



export const deletepolicy = asyncHandler(async (req, res) => {
  // Verify logged-in policy provider
  const policyProvider = req.user?._id;
  if (!policyProvider) {
    throw new ApiError(409, "User not found");
  }

  // Get policy_Id from the request body
  const { policy_Id } = req.body;
  if ([policy_Id].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // Find the policy by ID
  const existingPolicy = await Policy.findById(policy_Id);
  if (!existingPolicy) {
    throw new ApiError(404, "Policy not found");
  }

  // Verify that the policy belongs to the logged-in policy provider
  if (existingPolicy.policyProvider.toString() !== policyProvider.toString()) {
    throw new ApiError(403, "Unauthorized to delete this policy");
  }

  // Remove the policy from all policy holders' lists
  await policyHolder.updateMany(
    { policy_Id: policy_Id },
    { $pull: { policy_Id: policy_Id } }
  );

  // Optionally, if your policy document has an array of policyHolders,
  // you could update it or simply ignore it since you're deleting the entire policy.

await PolicyProvider.updateOne(
  { _id: policyProvider },
  { $pull: { policies: policy_Id } } // Assuming the field is named 'policies' on the policy provider
);

  
  // Delete the policy from the database
  await Policy.findByIdAndDelete(policy_Id);

  // Return success response
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Policy deleted successfully"));
});


export {
  createpolicy,
  addpolicy,
  
};