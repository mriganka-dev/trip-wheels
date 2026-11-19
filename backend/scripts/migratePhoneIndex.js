import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../src/db/index.js";

const migratePhoneIndex = async () => {
  console.log("Checking and updating user indexes for Google authentication...");

  try {
    await connectDB();
    const collection = mongoose.connection.collection("users");
    const existingIndexes = await collection.indexes();

    const phoneIndex = existingIndexes.find((idx) => idx.name === "phone_1" || idx.key?.phone);

    if (phoneIndex) {
      if (!phoneIndex.sparse) {
        console.log(`Dropping non-sparse phone index: ${phoneIndex.name}...`);
        await collection.dropIndex(phoneIndex.name);
        console.log("Creating sparse unique index on phone...");
        await collection.createIndex({ phone: 1 }, { unique: true, sparse: true });
        console.log("Sparse phone index created successfully.");
      } else {
        console.log("Phone index is already sparse. No drop needed.");
      }
    } else {
      console.log("Creating sparse unique index on phone...");
      await collection.createIndex({ phone: 1 }, { unique: true, sparse: true });
      console.log("Sparse phone index created successfully.");
    }

    const googleIdIndex = existingIndexes.find((idx) => idx.name === "googleId_1" || idx.key?.googleId);
    if (!googleIdIndex) {
      console.log("Creating sparse unique index on googleId...");
      await collection.createIndex({ googleId: 1 }, { unique: true, sparse: true });
      console.log("Sparse googleId index created successfully.");
    } else {
      console.log("googleId index already exists.");
    }

    console.log("Index migration completed successfully.");
  } catch (error) {
    console.error("Index migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
};

migratePhoneIndex();
