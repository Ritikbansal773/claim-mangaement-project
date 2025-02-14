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




export { createpolicy ,addpolicy};