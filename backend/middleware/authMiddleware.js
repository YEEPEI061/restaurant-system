const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // Check whether Authorization header exists
    if (!authHeader) {
      return res.status(401).json({
        message: 'Authentication token is required'
      });
    }

    // Expected format:
    // Authorization: Bearer <token>
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        message: 'Invalid authentication format'
      });
    }

    const token = parts[1];

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Store decoded user information in request
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Authentication token has expired'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid authentication token'
      });
    }

    console.error('Authentication error:', error);

    return res.status(500).json({
      message: 'Authentication failed'
    });
  }
}

module.exports = authenticateToken;