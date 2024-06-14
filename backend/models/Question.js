const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  text: { type: String, required: true },
  type: { type: String, enum: ['MCQ', 'Theory'], required: true },
  options: [String], 
  bloomLevel: { type: String, required: true },
  courseOutcome: { type: String, required: true },
  marks: { type: Number, required: true },
  image: { type: String } 
});

module.exports = mongoose.model('Question', questionSchema);
