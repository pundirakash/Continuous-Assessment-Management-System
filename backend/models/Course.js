const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  coordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  faculties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  assessments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' }],
  department:{type: String, required:true} 
});

module.exports = mongoose.model('Course', courseSchema);
