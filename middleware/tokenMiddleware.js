const tokenService = require('../services/tokenService');

const tokenMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = tokenService.verifyToken(token);
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(403).json({ error: error.message });
  }
};

module.exports = tokenMiddleware;
