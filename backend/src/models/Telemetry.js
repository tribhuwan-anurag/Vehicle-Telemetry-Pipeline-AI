const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema({
  time:           { type: Date, required: true },
  vehicleId:      { type: String, required: true },
  state:          { type: String, enum: ['PARKED', 'DRIVING', 'CHARGING'] },
  speed:          { type: Number },
  latitude:       { type: Number },
  longitude:      { type: Number },
  heading:        { type: Number },
  batterySoc:     { type: Number },
  batteryVoltage: { type: Number },
  batteryTemp:    { type: Number },
  batteryCurrent: { type: Number },
  batteryHealth:  { type: String, enum: ['HEALTHY', 'DEGRADING', 'CRITICAL'] },
  motorRpm:       { type: Number },
  motorTemp:      { type: Number },
  throttle:       { type: Number },
  regenBraking:   { type: Boolean },
  dtcs: [{
    code:        { type: String },
    severity:    { type: String },
    description: { type: String },
    firstSeen:   { type: Date },
  }],
}, { timestamps: false });

telemetrySchema.index({ vehicleId: 1, time: -1 });

module.exports = mongoose.model('Telemetry', telemetrySchema, 'telemetry');