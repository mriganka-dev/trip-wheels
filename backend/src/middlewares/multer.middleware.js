import fs from "fs";
import multer from "multer";
import path from "path";
import { ApiError } from "../utils/ApiError.js";

const uploadDir = path.resolve("public/temp");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const allowedMimes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        "Invalid file type. Only jpg, png, webp and pdf are allowed."
      ),
      false
    );
  }
};

const baseUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

export const checkFileSizeLimits = (req, res, next) => {
  const files = [];

  if (req.file) {
    files.push(req.file);
  }

  if (req.files) {
    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else {
      Object.values(req.files).forEach((group) => {
        if (Array.isArray(group)) {
          files.push(...group);
        }
      });
    }
  }

  for (const file of files) {
    const isImage = file.mimetype.startsWith("image/");
    const maxSizeBytes = isImage ? 5 * 1024 * 1024 : 8 * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkErr) {
          console.error("Failed to delete oversized file:", unlinkErr.message);
        }
      }

      return next(
        new ApiError(
          400,
          isImage
            ? "Image file exceeds the 5 MB limit"
            : "PDF file exceeds the 8 MB limit"
        )
      );
    }
  }

  next();
};

export const upload = baseUpload;

