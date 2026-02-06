const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
    key: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University' }
});

// A key is unique within a university (or NULL university for global defaults)
systemConfigSchema.index({ key: 1, universityId: 1 }, { unique: true });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
