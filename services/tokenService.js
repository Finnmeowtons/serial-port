const jwt = require('jsonwebtoken');

const SECRET_KEY = 'MarasiganBustilloSorianoSalasRepato';

class TokenService {
  static generateToken(userId, phoneNumber) {
    const payload = { userId, phoneNumber };
    return jwt.sign(payload, SECRET_KEY, { expiresIn: '7d' }); // 7 days expiry
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, SECRET_KEY);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

module.exports = TokenService;
