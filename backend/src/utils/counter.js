import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

export const getCounterModel = () => {
  return mongoose.models.Counter || mongoose.model("Counter", counterSchema);
};

export const getNextSequence = async (key) => {
  const Counter = getCounterModel();

  const record = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return record.seq;
};

