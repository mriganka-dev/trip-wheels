import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { notFound } from "./middlewares/notFound.middleware.js";
import { generalLimiter } from "./middlewares/rateLimit.middleware.js";
import { requestId } from "./middlewares/requestId.middleware.js";
import { sanitizeNoSql } from "./middlewares/sanitize.middleware.js";
import apiRouter from "./routes/index.js";
import { ApiError } from "./utils/ApiError.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(requestId);

const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) =>
  origin.trim()
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new ApiError(403, `Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);

app.use(generalLimiter);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(sanitizeNoSql);

app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(express.static("public"));

app.use("/api/v1", apiRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
