In This claim management project 
Feature 
1. can handle mutilply user
2.can handle multiply admin
3.jwt verification

endponit available

app.use("/api/v1/users", userRouter);
app.use("/api/v1/provider", providerRouter);
app.use("/api/v1/policy", policyrouter);
app.use("/api/v1/claim", claimrouter);



sub divided 
router.route("/allproviderclaims").get(verifyJWT, getProviderClaims);
router.route("/approveclaims").post(verifyJWT, approveClaim);
router.route("/allhoderclaims").get(verifyJWT, getAllClaimsForHolder);
router.route("/particularholderclaim").post(verifyJWT, getClaimById);

router.route("/deletepolic").post(verifyJWT, deletepolicy);
router.route("/removepolic").post(verifyJWT, removePolicy);

router.route("/login").post(loginholder);
router.route("/delete").post(verifyJWT, deletePolicyHolder);
router.route("/update")

router.route("/register")

router.route("/login")