const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For main faculty
  coordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For course coordinator
  faculties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // For all faculties teaching the course
  assessments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' }] // For all assessments allocated to the course
});

module.exports = mongoose.model('Course', courseSchema);
