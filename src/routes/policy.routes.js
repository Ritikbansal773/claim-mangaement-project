import { Router } from "express";
import {
  createpolicy,
  addpolicy,
  getAllPolicies,
  updatePolicy,
  deletepolicy,
  removePolicy,
} from "../controllers/policy.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/create").post(
  upload.fields([
    {
      name: "coverageDetail",
      maxCount: 1,
    },
    {
      name: "certificateOfInsurance",
      maxCount: 1,
    },
    {
      name: "termsAndConditions",
      maxCount: 1,
    },
  ]),
  verifyJWT,
  createpolicy
);

router.route("/add").post(verifyJWT, addpolicy);
router.route("/all").get( getAllPolicies);
router.route("/updatepolic").post(
  upload.fields([
    {
      name: "coverageDetail",
      maxCount: 1,
    },
    {
      name: "certificateOfInsurance",
      maxCount: 1,
    },
    {
      name: "termsAndConditions",
      maxCount: 1,
    },
  ]),
  verifyJWT,
  updatePolicy
);
router.route("/deletepolic").post(verifyJWT, deletepolicy);
router.route("/removepolic").post(verifyJWT, removePolicy);
export default router;
