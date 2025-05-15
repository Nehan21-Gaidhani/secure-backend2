const jwt = require('jsonwebtoken');
//jwt token
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('No Authorization header');
    return res.status(403).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('Token not found in header');
    return res.status(403).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('JWT verification error:', error.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};
