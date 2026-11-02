import mongoose from "mongoose";
import { DOCUMENT_STATUS, DOCUMENT_TYPES } from "../constants.js";

const verificationDocumentSchema = new mongoose.Schema({
  publisher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: Object.values(DOCUMENT_TYPES),
    required: true,
  },
  documentNumberMasked: {
    type: String,
    required: true,
  },
  file: {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
  },
  status: {
    type: String,
    enum: Object.values(DOCUMENT_STATUS),
    default: DOCUMENT_STATUS.PENDING,
    index: true,
  },
  remarks: {
    type: String,
    default: "",
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

export const VerificationDocument = mongoose.model(
  "VerificationDocument",
  verificationDocumentSchema
);
