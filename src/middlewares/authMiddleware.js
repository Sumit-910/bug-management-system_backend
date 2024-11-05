const { verifyAccessToken } = require('../utils/jwtUtils');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    // console.log("token in if " + token);
    
    return res.status(401).json({ msg: 'Invalid tokenn' });
  }
// console.log("token out " + token);

  try {
    const decoded = verifyAccessToken(token);
    // console.log("haha");
    
    req.userId = decoded.userId;
    next();
  } catch (err) {
    // console.log("error");
    
    res.status(401).json({ msg: 'Invalid tokennn' });
  }
};

module.exports = authMiddleware;
