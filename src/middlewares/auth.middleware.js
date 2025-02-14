import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { policyHolder } from "../models/policyholder.models.js";
import { PolicyProvider } from "../models/policyprovider.model.js";
import mongoose from "mongoose";
export const verifyJWT = asyncHandler(async (req, _, next) => {
  console.log(req.cookies?.accessToken);
  
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // console.log(token);
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }
let User=null;


    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log(decodedToken);
    
const modelName = decodedToken?.companyName ? "PolicyProvider" : "policyHolder";
const UserModel = mongoose.model(modelName);
console.log(UserModel);
    const user = await UserModel.findOne({
      email: decodedToken?.email,
    }).select("-password -refreshToken");
console.log(decodedToken?.companyName);

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
