import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { PolicyProvider } from "../models/policyprovider.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { policyHolder } from "../models/policyholder.models.js";
import { Policy } from "../models/policy.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

