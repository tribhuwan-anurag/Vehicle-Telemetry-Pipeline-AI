const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  vehicleId:  { type: String, required: true, index: true },
  alertType:  { type: String, required: true },
  severity:   { type: String, required: true, enum: ['INFO', 'WARNING', 'CRITICAL'] },
  message:    { type: String },
  resolved:   { type: Boolean, default: false },
  resolvedAt: { type: Date, default: null },
}, {
  timestamps: { createdAt: 'time', updatedAt: false },
});

alertSchema.index({ resolved: 1, severity: 1, time: -1 });

alertSchema.statics.isAlertActive = async function (vehicleId, alertType) {
  const count = await this.countDocuments({ vehicleId, alertType, resolved: false });
  return count > 0;
};

module.exports = mongoose.model('Alert', alertSchema);