const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  termId: { type: Number, required: true },
  type: { type: String, required: true },
  facultyQuestions: [{
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sets: [{
      setName: { type: String, required: true },
      questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
      hodStatus: { type: String, enum: ['Pending', 'Submitted', 'Approved', 'Rejected', 'Approved with Remarks'], default: 'Pending' },
      hodRemarks: { type: String },
      coordinatorStatus: { type: String, enum: ['Pending', 'Submitted', 'Approved', 'Rejected', 'Approved with Remarks'], default: 'Pending' },
      coordinatorRemarks: { type: String },
      allotmentDate: { type: Date },
      submissionDate: { type: Date },
      maximumMarks: { type: Number },
      totalQuestions: { type: Number, default: 0 } 
    }]
  }],
});

module.exports = mongoose.model('Assessment', assessmentSchema);
