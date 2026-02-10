const mongoose = require('mongoose');

const termArchiveSchema = new mongoose.Schema({
    termId: { type: String, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['Faculty', 'CourseCoordinator'], default: 'Faculty' },
    universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }
}, { timestamps: true });

// Compound index to prevent duplicates
termArchiveSchema.index({ termId: 1, courseId: 1, facultyId: 1, universityId: 1 }, { unique: true });

// Indexes for HOD Dashboard Performance
termArchiveSchema.index({ termId: 1, facultyId: 1 });
termArchiveSchema.index({ termId: 1, courseId: 1 });

module.exports = mongoose.model('TermArchive', termArchiveSchema);
