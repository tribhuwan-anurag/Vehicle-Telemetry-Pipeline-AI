const Alert = require('../models/Alert');
const logger = require('../utils/logger');

let _io = null;
const setIO = (io) => { _io = io; };

const evaluate = async (doc) => {
  await checkBatterySoc(doc);
  await checkBatteryTemp(doc);
  await checkVoltageAnomaly(doc);
  await checkMotorTemp(doc);
  await checkOverspeed(doc);
};

const checkBatterySoc = async (doc) => {
  if (doc.batterySoc == null) return;
  if (doc.batterySoc < 5) {
    await raiseAlert(doc.vehicleId, 'CRITICAL_BATTERY', 'CRITICAL',
      `Battery SOC critically low at ${doc.batterySoc.toFixed(1)}%`);
  } else if (doc.batterySoc < 15) {
    await raiseAlert(doc.vehicleId, 'LOW_BATTERY', 'WARNING',
      `Battery SOC low at ${doc.batterySoc.toFixed(1)}%`);
  }
};

const checkBatteryTemp = async (doc) => {
  if (doc.batteryTemp == null) return;
  if (doc.batteryTemp > 55) {
    await raiseAlert(doc.vehicleId, 'BATTERY_OVERHEAT_CRITICAL', 'CRITICAL',
      `Battery temp ${doc.batteryTemp.toFixed(1)}°C exceeds critical limit`);
  } else if (doc.batteryTemp > 45) {
    await raiseAlert(doc.vehicleId, 'BATTERY_OVERHEAT', 'WARNING',
      `Battery temp ${doc.batteryTemp.toFixed(1)}°C approaching limit`);
  }
};

const checkVoltageAnomaly = async (doc) => {
  if (doc.batteryVoltage == null || doc.batterySoc == null) return;
  if (doc.batteryVoltage < 330 && doc.batterySoc > 50) {
    await raiseAlert(doc.vehicleId, 'VOLTAGE_ANOMALY', 'CRITICAL',
      `Voltage ${doc.batteryVoltage.toFixed(1)}V too low for SOC ${doc.batterySoc.toFixed(1)}%`);
  }
};

const checkMotorTemp = async (doc) => {
  if (doc.motorTemp == null) return;
  if (doc.motorTemp > 90) {
    await raiseAlert(doc.vehicleId, 'MOTOR_OVERHEAT', 'WARNING',
      `Motor temp ${doc.motorTemp.toFixed(1)}°C exceeds safe limit`);
  }
};

const checkOverspeed = async (doc) => {
  if (doc.speed == null) return;
  if (doc.speed > 120) {
    await raiseAlert(doc.vehicleId, 'OVERSPEED', 'INFO',
      `Vehicle speed ${doc.speed.toFixed(1)} km/h exceeds 120 km/h`);
  }
};

const raiseAlert = async (vehicleId, alertType, severity, message) => {
  const isActive = await Alert.isAlertActive(vehicleId, alertType);
  if (isActive) return;

  const alert = await Alert.create({ vehicleId, alertType, severity, message });
  logger.info(`[ALERT] ${vehicleId} | ${severity} | ${alertType} | ${message}`);

  if (_io) {
    _io.emit('alert', {
      id: alert._id, vehicleId, alertType, severity, message, time: alert.time,
    });
  }
};

module.exports = { evaluate, setIO };