const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  text: { type: String, required: true,unique: true },
  type: { type: String, enum: ['MCQ', 'Subjective'], required: true },
  options: [String],
  bloomLevel: { type: String, required: true },
  courseOutcome: { type: String, required: true },
  marks: { type: Number, required: true },
  image: { type: String },
  status: { type: String, enum: ['Pending', 'Submitted', 'Approved', 'Rejected'] },
  solution: { type: String }
});

module.exports = mongoose.model('Question', questionSchema);
