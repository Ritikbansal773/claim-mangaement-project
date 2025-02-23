import { Router } from "express";
import {
  createClaim,
  getClaimById,
  getAllClaimsForHolder,
  approveClaim,
  getProviderClaims,
} from "../controllers/claim.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/create").post(
 
  verifyJWT,
  upload.fields([
    { name: "accidentReport", maxCount: 1 },
    { name: "invoiceDocument", maxCount: 1 },
    { name: "photoEvidence", maxCount: 1 },
    { name: "additionalDocuments", maxCount: 1 },
  ]),
  createClaim
);

router.route("/allproviderclaims").get(verifyJWT, getProviderClaims);
router.route("/approveclaims").post(verifyJWT, approveClaim);
router.route("/allhoderclaims").get(verifyJWT, getAllClaimsForHolder);
router.route("/particularholderclaim").post(verifyJWT, getClaimById);

export default router;