const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = (roles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.header('Authorization').replace('Bearer ', '');
      console.log('Token:', token);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded:', decoded);
      const user = await User.findOne({ _id: decoded._id });
      console.log('User:', user);

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
