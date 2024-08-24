const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = (roles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ _id: decoded._id });
      if (!user || (roles.length && !roles.includes(user.role))) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      req.user = user;
      next();
    } catch (error) {
      console.log('Error:', error.message);
      res.status(401).json({ message: 'Not authorized', error: error.message });
    }
  };
};
