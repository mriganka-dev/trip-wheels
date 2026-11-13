export const getPagination = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const requestedLimit = parseInt(query.limit, 10) || 10;
  const limit = Math.min(50, Math.max(1, requestedLimit));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const formatPaginatedResponse = ({
  items = [],
  totalItems = 0,
  page = 1,
  limit = 10,
}) => {
  const safeLimit = limit > 0 ? limit : 10;
  const totalPages = Math.ceil(totalItems / safeLimit);

  return {
    items,
    page,
    limit: safeLimit,
    totalItems,
    totalPages,
  };
};
