const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  uid: { type: Number, required: true },
  department: { type: String }, // Keep for compatibility
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'HOD', 'Faculty', 'CourseCoordinator'], required: true },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  notifications: [
    {
      message: { type: String, required: true },
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  isDeleted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
});

// Compound index: UID and Email are unique within a university
userSchema.index({ uid: 1, universityId: 1 }, { unique: true });
userSchema.index({ email: 1, universityId: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
