import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { policyHolder } from "../models/policyholder.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Policy } from "../models/policy.models.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const holder = await policyHolder.findById(userId);
    const accessToken = holder.generateAccessToken();
    const refreshToken = holder.generateRefreshToken();

    holder.refreshToken = refreshToken;
    await holder.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerpolicyholder = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullName, email, username, password } = req.body;
  //console.log("email: ", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await policyHolder.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  //console.log(req.files);

  const addressProofLocalPath = req.files?.addressProof[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;
 const ageProofLocalPath = req.files?.ageProof[0]?.path;
  const identityProofLocalPath = req.files?.identityProof[0]?.path;
console.log(addressProofLocalPath);


  if (!(addressProofLocalPath && identityProofLocalPath && ageProofLocalPath)) {
    throw new ApiError(400, "All file is required");
  }

  const addressProof = await uploadOnCloudinary(addressProofLocalPath);
   const ageProof = await uploadOnCloudinary(ageProofLocalPath);
  const identityProof = await uploadOnCloudinary(
    identityProofLocalPath
  );

  if (!(addressProof && ageProof && identityProof)) {
    throw new ApiError(400, "all file is required");
  }

  const policyHolde = await policyHolder.create({
    fullName,
    addressProof: addressProof.url,
    ageProof: ageProof?.url || "",
    identityProof: identityProof?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdpolicyHolder = await policyHolder
    .findById(policyHolde._id)
    .select("-password -refreshToken");

  if (!createdpolicyHolder) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(200, createdpolicyHolder, "User registered Successfully")
    );
});


const loginholder = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie

  const { email, username, password } = req.body;
  console.log(email);

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // Here is an alternative of above code based on logic discussed in video:
  // if (!(username || email)) {
  //     throw new ApiError(400, "username or email is required")

  // }

  const hold = await policyHolder.findOne({
    $or: [{ username }, { email }],
  });

  if (!hold) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await hold.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    hold._id
  );

  const loggedInUser = await policyHolder
    .findById(hold._id)
    .select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});
 

export const updateHolder = asyncHandler(async (req, res) => {
  // Get the logged-in policy holder's ID from req.user
  const policyHolderId = req.user?._id;
  if (!policyHolderId) {
    throw new ApiError(409, "User not found");
  }

  // Extract text fields from the request body
  const { fullName, email, username, password } = req.body;

  // Validate that all required text fields are provided
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if another user already exists with the new email or username (exclude the current user)
  const existedUser = await policyHolder.findOne({
    $or: [{ username }, { email }],
    _id: { $ne: policyHolderId },
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // Retrieve the current policy holder document
  const userToUpdate = await policyHolder.findById(policyHolderId);
  if (!userToUpdate) {
    throw new ApiError(409, "User not found");
  }

  // Update text fields
  userToUpdate.fullName = fullName.trim();
  userToUpdate.email = email.trim();
  userToUpdate.username = username.toLowerCase().trim();
  userToUpdate.password = password; // Pre-save hook should hash this if modified

  // Handle file updates if new files are provided; if not, keep the current file URLs.
  if (req.files?.addressProof && req.files.addressProof[0]) {
    const addressProofLocalPath = req.files.addressProof[0].path;
    const addressProof = await uploadOnCloudinary(addressProofLocalPath);
    if (addressProof && addressProof.url) {
      userToUpdate.addressProof = addressProof.url;
    }
  }
  if (req.files?.ageProof && req.files.ageProof[0]) {
    const ageProofLocalPath = req.files.ageProof[0].path;
    const ageProof = await uploadOnCloudinary(ageProofLocalPath);
    if (ageProof && ageProof.url) {
      userToUpdate.ageProof = ageProof.url;
    }
  }
  if (req.files?.identityProof && req.files.identityProof[0]) {
    const identityProofLocalPath = req.files.identityProof[0].path;
    const identityProof = await uploadOnCloudinary(identityProofLocalPath);
    if (identityProof && identityProof.url) {
      userToUpdate.identityProof = identityProof.url;
    }
  }

  // Save the updated document; pre-save middleware should handle password hashing, etc.
  await userToUpdate.save();

  // Retrieve the updated policy holder document, excluding sensitive fields
  const updatedPolicyHolder = await policyHolder
    .findById(policyHolderId)
    .select("-password -refreshToken");

  if (!updatedPolicyHolder) {
    throw new ApiError(500, "Something went wrong while updating the user");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPolicyHolder, "User updated successfully")
    );
});




export const deletePolicyHolder = asyncHandler(async (req, res) => {
  // Get the logged-in policy holder's ID from req.user (set by your authentication middleware)
  const policyHolderId = req.user?._id;
  if (!policyHolderId) {
    throw new ApiError(409, "User not found");
  }

  // Remove the policy holder's reference from all policies where they're listed
  await Policy.updateMany(
    { policyHolders: policyHolderId }, // Find policies where this ID is present in the policyHolders array
    { $pull: { policyHolders: policyHolderId } } // Remove the policyHolderId from the array
  );

  // Delete the policy holder document from the database
  const deletedHolder = await policyHolder.findByIdAndDelete(policyHolderId);
  if (!deletedHolder) {
    throw new ApiError(500, "Failed to delete the user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Policy holder deleted successfully"));
});


export { registerpolicyholder, loginholder };