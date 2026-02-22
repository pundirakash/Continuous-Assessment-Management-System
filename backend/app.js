const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const hodRoutes = require('./routes/hodRoutes');
const coordinatorRoutes = require('./routes/coordinatorRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const chatRoutes = require('./routes/chatRoutes');


const app = express();
const corsOptions = {
  origin: `${process.env.ORIGIN}` || 'https://continuous-assessment-management-system.vercel.app',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/chat', chatRoutes);


app.options('*', cors(corsOptions));

// Connect to MongoDB and start the server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    const server = app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
    server.setTimeout(300000);
  })
  .catch((error) => console.log(error));

module.exports = app;
