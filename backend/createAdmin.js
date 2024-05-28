const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const hashedPassword = await bcrypt.hash('adminpassword', 10); // Change 'adminpassword' to a strong password
    const admin = new User({
      name: 'Admin',
      email: 'admin@example.com', // Change email as required
      password: hashedPassword,
      role: 'Admin',
    });

    await admin.save();
    console.log('Admin user created successfully');
    process.exit();
  } catch (error) {
    console.error('Error creating admin user', error);
    process.exit(1);
  }
};

createAdmin();
