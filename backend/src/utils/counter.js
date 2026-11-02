import { Counter } from "../models/counter.model.js";

export const getCounterModel = () => {
  return Counter;
};

export const getNextSequence = async (key) => {
  const record = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return record.seq;
};

export const generateBookingCode = async () => {
  const seq = await getNextSequence("bookingCode");
  return `TW-${String(seq).padStart(6, "0")}`;
};
