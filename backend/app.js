const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const hodRoutes = require('./routes/hodRoutes');
const coordinatorRoutes = require('./routes/coordinatorRoutes');
const facultyRoutes = require('./routes/facultyRoutes');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/faculty', facultyRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`)))
  .catch((error) => console.log(error));

module.exports=app;
