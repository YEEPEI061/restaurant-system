function notFoundHandler(req, res, next) {
    res.status(404).json({
      message: `Route not found: ${req.method} ${req.originalUrl}`
    });
  }
  
  function errorHandler(err, req, res, next) {
    console.error('Server error:', err);
  
    const statusCode = err.statusCode || 500;
  
    res.status(statusCode).json({
      message:
        err.message || 'An unexpected server error occurred'
    });
  }
  
  module.exports = {
    notFoundHandler,
    errorHandler
  };