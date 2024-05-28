const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  termId: { type: Number, required: true },
  type:{type:String, required:true},
  facultyQuestions: [{
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Approved with Remarks'], default: 'Pending' },
    remarks: { type: String },
    allotmentDate: { type: Date},
    submissionDate: { type: Date},
    maximumMarks: { type: Number}
  }],
});

module.exports = mongoose.model('Assessment', assessmentSchema);
