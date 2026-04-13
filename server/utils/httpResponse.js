export function sendSuccess(res, statusCode, data = {}) {
  return res.status(statusCode).json({
    success: true,
    ...data,
  });
}

export function sendError(res, statusCode, message, extra = {}) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...extra,
  });
}

