/**
 * Shared response helpers — consistent API envelope
 */

const success = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

const created = (res, data) => success(res, data, 201);

const paginated = (res, { data, total, page, limit }) =>
  res.status(200).json({
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });

/**
 * Parse common pagination + filter query params
 */
const parsePagination = (query) => {
  const page  = Math.max(1, parseInt(query.page  ?? 1,  10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? 20, 10)));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Throw a standard HTTP error (picked up by errorHandler)
 */
const httpError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

module.exports = { success, created, paginated, parsePagination, httpError };
