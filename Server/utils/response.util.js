// Standard API response utility
const createResponse = (success = true, data = null, message = '', statusCode = 200) => {
  const response = {
    success,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  if (statusCode !== 200) {
    response.statusCode = statusCode;
  }

  return response;
};

// Pagination helper
const createPaginatedResponse = (data, page, limit, total, message = '') => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalRecords: total,
      recordsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    },
    message,
    timestamp: new Date().toISOString()
  };
};

// Error response helper
const createErrorResponse = (message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    statusCode,
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.errors = errors;
  }

  return response;
};

module.exports = {
  createResponse,
  createPaginatedResponse,
  createErrorResponse
};
