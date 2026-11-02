import { Destination } from "../models/destination.model.js";
import { ApiError } from "../utils/ApiError.js";
import { formatPaginatedResponse, getPagination } from "../utils/pagination.js";

export const createDestination = async (data) => {
  const existing = await Destination.findOne({ slug: data.slug });
  if (existing) {
    throw new ApiError(409, "Destination with this slug already exists");
  }

  return await Destination.create(data);
};

export const updateDestination = async (id, data) => {
  const destination = await Destination.findById(id);
  if (!destination) {
    throw new ApiError(404, "Destination not found");
  }

  Object.assign(destination, data);
  await destination.save();
  return destination;
};

export const getActiveDestinations = async () => {
  return await Destination.find({ isActive: true })
    .sort({ name: 1 })
    .select("-__v");
};

export const getDestinationByIdOrSlug = async (identifier) => {
  let destination = null;

  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    destination = await Destination.findById(identifier);
  } else {
    destination = await Destination.findOne({
      slug: identifier.toLowerCase(),
    });
  }

  if (!destination) {
    throw new ApiError(404, "Destination not found");
  }

  return destination;
};

export const getAllDestinations = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "true";
  }

  const [items, totalItems] = await Promise.all([
    Destination.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Destination.countDocuments(filter),
  ]);

  return formatPaginatedResponse({ items, totalItems, page, limit });
};
