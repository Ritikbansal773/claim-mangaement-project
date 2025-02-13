import { Router } from "express";
import {
  registerpolicyprovider,
  loginprovider,
} from "../controllers/policyprovider.contoller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/register").post(
  upload.fields([
    {
      name: "companyProof",
      maxCount: 1,
    },
    {
      name: "license",
      maxCount: 1,
    },
    {
      name: "addressProof",
      maxCount: 1,
    },
  ]),
  registerpolicyprovider
);

router.route("/login").post(loginprovider);

export default router;
