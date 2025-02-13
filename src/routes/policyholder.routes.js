import { Router } from "express";
import {
  registerpolicyholder,
  loginholder,
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

export default router;