const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.registerUser = async (req, res) => {
  try {
    const { name, uid, department, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, uid, department, password: hashedPassword, role });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all users (excluding passwords)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get users by department
exports.getUsersByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const users = await User.find({ department }).select('-password');

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'No users found in this department' });
    }

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Edit user details
exports.editUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, uid, department, email, role } = req.body;

    const user = await User.findByIdAndUpdate(userId, { name, uid, department, email, role }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Bulk register users
exports.bulkRegister = async (req, res) => {
  try {
    const users = req.body.users;

    const userPromises = users.map(async (user) => {
      const existingUser = await User.findOne({ email: user.email });
      if (existingUser) {
        throw new Error(`User with email ${user.email} already exists`);
      }

      user.password = await bcrypt.hash(user.password, 10);
      return User.create(user);
    });

    await Promise.all(userPromises);

    res.status(201).send({ message: 'Users created successfully' });
  } catch (error) {
    console.error('Error creating users:', error);
    res.status(500).send({ message: `Error creating users: ${error.message}` });
  }
};
