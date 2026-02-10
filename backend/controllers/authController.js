const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { name, uid, department, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, uid, department, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log(`[Auth] Login attempt for email: ${email}`);
  try {
    console.log('[Auth] Querying DB for user...');
    // Optimization: Use lean() for faster read
    const user = await User.findOne({ email }).populate('departmentId').lean();
    console.log(`[Auth] DB Query result: ${user ? 'Human Found' : 'Not Found'}`);

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('[Auth] Verifying password...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`[Auth] Password match result: ${isMatch}`);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Fallback for department name: Use legacy string OR populated name
    const deptName = user.department || (user.departmentId ? user.departmentId.name : '');

    console.log('[Auth] Generating token...');
    const token = jwt.sign({
      _id: user._id,
      role: user.role,
      user: user.name,
      uid: user.uid,
      department: deptName,
      departmentId: user.departmentId ? user.departmentId._id : user.departmentId, // ensure ID is passed if populated
      schoolId: user.schoolId,
      universityId: user.universityId
    }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(200).json({ token });
    console.log('[Auth] Token sent.');
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.adminResetPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    if (!req.user || req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}
