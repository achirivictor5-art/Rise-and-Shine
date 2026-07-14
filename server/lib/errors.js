class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

module.exports = {
  AppError,
  badRequest: (m) => new AppError(400, m),
  unauthorized: (m) => new AppError(401, m || 'Not authenticated.'),
  forbidden: (m) => new AppError(403, m || 'Not allowed.'),
  notFound: (m) => new AppError(404, m || 'Not found.'),
  conflict: (m) => new AppError(409, m),
};
