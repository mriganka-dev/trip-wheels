import { ZodError } from "zod";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (error instanceof ZodError) {
    const errorMessages = error.issues.map(
      (issue) => `${issue.path.join(".") || "value"}: ${issue.message}`
    );
    error = new ApiError(400, "Validation failed", errorMessages);
  } else if (error.name === "ValidationError") {
    const errorMessages = Object.values(error.errors || {}).map(
      (val) => val.message
    );
    error = new ApiError(400, "Mongoose validation failed", errorMessages);
  } else if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "field";
    error = new ApiError(409, `Duplicate value for ${field}`);
  } else if (error.name === "CastError") {
    error = new ApiError(400, `Invalid value for ${error.path}`);
  } else if (error.name === "JsonWebTokenError") {
    error = new ApiError(401, "Invalid token");
  } else if (error.name === "TokenExpiredError") {
    error = new ApiError(401, "Token expired");
  } else if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal server error";
    error = new ApiError(statusCode, message, [], error.stack);
  }

  const response = {
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || [],
    success: false,
  };

  if (req.id) {
    response.requestId = req.id;
  }

  if (env.NODE_ENV !== "production" && error.stack) {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};
