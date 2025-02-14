import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import userRouter from "./routes/policyholder.routes.js";
import providerRouter from "./routes/policyprovider.routes.js";
import policyrouter from "./routes/policy.routes.js";
//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/provider", providerRouter);
app.use("/api/v1/policy", policyrouter);


export { app };
