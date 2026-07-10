function errorHandler(err, req, res, next) {
  console.error('[API Gateway Error]:', err);
  
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    success: false,
    message: `[API Gateway Error] ${message}`
  });
}

module.exports = errorHandler;
