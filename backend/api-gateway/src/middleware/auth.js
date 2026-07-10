const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

function verifyJWT(req, res, next) {
  let token = req.cookies?.token;

  // Fallback to Authorization header if cookie is not present
  if (!token) {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: No authentication token provided in cookies or header.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach decoded user info to request
    req.user = decoded;

    // Inject headers to forward to downstream services
    req.headers['x-user-id'] = decoded.id;
    req.headers['x-user-username'] = decoded.username;
    req.headers['x-user-email'] = decoded.email;
    req.headers['x-user-region'] = decoded.region;

    next();
  } catch (error) {
    console.error('JWT Verification failed:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Access denied: Invalid or expired token.'
    });
  }
}

module.exports = {
  verifyJWT
};
