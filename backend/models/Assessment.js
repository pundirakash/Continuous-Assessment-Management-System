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
      totalQuestions: { type: Number, default: 0 },
      activityLog: [{
        action: { type: String, required: true }, // 'Created', 'Submitted', 'Approved', 'Rejected', 'Downloaded', 'Bulk Imported'
        date: { type: Date, default: Date.now },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        details: { type: String }
      }],
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedByName: { type: String },
      approvalDate: { type: Date }
    }]
  }],
});

// Indexes for HOD Dashboard Performance
assessmentSchema.index({ termId: 1, course: 1 });
assessmentSchema.index({ 'facultyQuestions.faculty': 1 });

module.exports = mongoose.model('Assessment', assessmentSchema);
