import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { policyHolder } from "../models/policyholder.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
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

export { registerpolicyholder, loginholder };