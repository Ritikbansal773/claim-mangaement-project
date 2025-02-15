import { Router } from "express";
import {
  registerpolicyholder,
  loginholder,
  deletePolicyHolder,
  updateHolder,
} from "../controllers/policyHolder.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/register").post(
  upload.fields([
    {
      name: "addressProof",
      maxCount: 1,
    },
    {
      name: "ageProof",
      maxCount: 1,
    },
    {
      name: "identityProof",
      maxCount: 1,
    },
  ]),
  registerpolicyholder
);

router.route("/login").post(loginholder);
router.route("/delete").post(verifyJWT, deletePolicyHolder);
router.route("/update").post(
  upload.fields([
    {
      name: "addressProof",
      maxCount: 1,
    },
    {
      name: "ageProof",
      maxCount: 1,
    },
    {
      name: "identityProof",
      maxCount: 1,
    },
  ]),
  verifyJWT,
  updateHolder
);

export default router;