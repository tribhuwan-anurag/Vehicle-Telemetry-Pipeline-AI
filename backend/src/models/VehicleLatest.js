const mongoose = require('mongoose');

const vehicleLatestSchema = new mongoose.Schema({
  vehicleId:      { type: String, required: true, unique: true },
  lastSeen:       { type: Date, required: true },
  state:          { type: String },
  batterySoc:     { type: Number },
  batteryVoltage: { type: Number },
  batteryTemp:    { type: Number },
  batteryHealth:  { type: String },
  speed:          { type: Number },
  latitude:       { type: Number },
  longitude:      { type: Number },
  activeDtcCount: { type: Number, default: 0 },
}, { timestamps: false });

module.exports = mongoose.model('VehicleLatest', vehicleLatestSchema);