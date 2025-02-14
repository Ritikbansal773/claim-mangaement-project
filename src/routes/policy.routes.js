import { Router } from "express";
import { createpolicy, addpolicy } from "../controllers/policy.controller.js";
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

export default router;
