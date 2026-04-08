const express = require('express');
const router = express.Router();
const Telemetry = require('../models/Telemetry');
const VehicleLatest = require('../models/VehicleLatest');
const Alert = require('../models/Alert');

// GET /api/fleet/health
router.get('/fleet/health', async (req, res) => {
  try {
    const vehicles = await VehicleLatest.find();
    const healthBreakdown = {};
    vehicles.forEach(v => {
      const h = v.batteryHealth || 'UNKNOWN';
      healthBreakdown[h] = (healthBreakdown[h] || 0) + 1;
    });

    const alertCounts = await Alert.aggregate([
      { $match: { resolved: false } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);
    const alertBreakdown = {};
    alertCounts.forEach(a => { alertBreakdown[a._id] = a.count; });

    const activeAlerts = await Alert.countDocuments({ resolved: false });

    res.json({ totalVehicles: vehicles.length, healthBreakdown, alertBreakdown, activeAlerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fleet/vehicles
router.get('/fleet/vehicles', async (req, res) => {
  try {
    const vehicles = await VehicleLatest.find().sort({ lastSeen: -1 });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vehicle/:id/diagnostics
router.get('/vehicle/:id/diagnostics', async (req, res) => {
  try {
    const { id } = req.params;
    const current = await VehicleLatest.findOne({ vehicleId: id });
    if (!current) return res.status(404).json({ error: `Vehicle ${id} not found` });

    const activeAlerts = await Alert.find({ vehicleId: id, resolved: false }).sort({ time: -1 });
    const latestTelemetry = await Telemetry.findOne({ vehicleId: id }).sort({ time: -1 });

    res.json({ current, activeAlerts, dtcs: latestTelemetry?.dtcs || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vehicle/:id/history?window=1h|6h|24h|7d
router.get('/vehicle/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const window = req.query.window || '1h';
    const now = new Date();
    let start;
    switch (window) {
      case '1h':  start = new Date(now - 1 * 60 * 60 * 1000); break;
      case '6h':  start = new Date(now - 6 * 60 * 60 * 1000); break;
      case '24h': start = new Date(now - 24 * 60 * 60 * 1000); break;
      case '7d':  start = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
      default:    start = new Date(now - 1 * 60 * 60 * 1000);
    }
    const records = await Telemetry.find({
      vehicleId: id, time: { $gte: start, $lte: now },
    }).sort({ time: -1 }).limit(1000).select('-__v');
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts/active
router.get('/alerts/active', async (req, res) => {
  try {
    const alerts = await Alert.find({ resolved: false }).sort({ severity: -1, time: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alerts/:id/resolve
router.patch('/alerts/:id/resolve', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { resolved: true, resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;