import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { PolicyProvider } from "../models/policyprovider.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const provider = await PolicyProvider.findById(userId);
    const accessToken = provider.generateAccessToken();
    const refreshToken = provider.generateRefreshToken();

    provider.refreshToken = refreshToken;
    await provider.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerpolicyprovider = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { companyName, email, brandName, password, policyTypes } = req.body;
  //console.log("email: ", email);

  if (
    [companyName, email, brandName, password].some(
      (field) => field?.trim() === ""
    ) &&
    policyTypes.length !=0
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await PolicyProvider.findOne({
    $or: [{ brandName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  //console.log(req.files);

  const addressProofLocalPath = req.files?.addressProof[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;
  const companyProofLocalPath = req.files?.companyProof[0]?.path;
  const licenseLocalPath = req.files?.license[0]?.path;
  console.log(addressProofLocalPath);

  if (!(addressProofLocalPath && licenseLocalPath && companyProofLocalPath)) {
    throw new ApiError(400, "All file is required");
  }

  const addressProof = await uploadOnCloudinary(addressProofLocalPath);
  const companyProof = await uploadOnCloudinary(companyProofLocalPath);
  const license = await uploadOnCloudinary(licenseLocalPath);

  if (!(addressProof && companyProof && license)) {
    throw new ApiError(400, "all file is required");
  }
console.log(email);
  const policyprovid = await PolicyProvider.create({
    companyName,
    addressProof: addressProof.url,
    companyProof: companyProof?.url || "",
    license: license?.url || "",
    email,
    policyTypes,
    password,
    brandName: brandName.toLowerCase(),
  });

  const createdpolicyproviders = await PolicyProvider.findById(
    policyprovid._id
  ).select("-password -refreshToken");

  if (!createdpolicyproviders) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        createdpolicyproviders,
        "User registered Successfully"
      )
    );
});


const loginprovider = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie

  const { email, companyName, password } = req.body;
  console.log(email);

  if (!companyName && !email) {
    throw new ApiError(400, "companyName or email  is required");
  }

  // Here is an alternative of above code based on logic discussed in video:
  // if (!(username || email)) {
  //     throw new ApiError(400, "username or email is required")

  // }

  const prod = await PolicyProvider.findOne({
    $or: [{ companyName }, { email }],
  });

  if (!prod) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await prod.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    prod._id
  );

  const loggedInprovider = await PolicyProvider.findById(prod._id).select(
    "-password -refreshToken"
  );

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
          user: loggedInprovider,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

export { registerpolicyprovider, loginprovider };
