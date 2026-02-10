const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  coordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  faculties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assessments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' }],
  department: { type: String }, // Keep for migration/compatibility
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
  activeTerms: [{ type: String }],
  isDeleted: { type: Boolean, default: false }
});

// Compound index: A code is unique within a school
courseSchema.index({ code: 1, schoolId: 1 }, { unique: true });

// Indexes for HOD Dashboard Performance
courseSchema.index({ department: 1, activeTerms: 1 });
courseSchema.index({ departmentId: 1, activeTerms: 1 });
courseSchema.index({ faculties: 1 });
courseSchema.index({ coordinator: 1 });

module.exports = mongoose.model('Course', courseSchema);
