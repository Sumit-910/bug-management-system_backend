const { verifyAccessToken } = require('../utils/jwtUtils');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ msg: 'Invalid tokenn' });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid tokennn' });
  }
};

module.exports = authMiddleware;
