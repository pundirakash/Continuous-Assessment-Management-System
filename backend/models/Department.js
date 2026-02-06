const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
    universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
    createdAt: { type: Date, default: Date.now }
});

// A department name is unique within a school and university
departmentSchema.index({ name: 1, schoolId: 1, universityId: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
