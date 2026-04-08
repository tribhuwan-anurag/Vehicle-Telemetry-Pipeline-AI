const mqtt = require('mqtt');
const protobuf = require('protobufjs');
const path = require('path');
const logger = require('../utils/logger');
const Telemetry = require('../models/Telemetry');
const VehicleLatest = require('../models/VehicleLatest');
const alertEvaluator = require('./alertEvaluator');

let TelemetryEvent = null;

const STATE_MAP = { 0: 'PARKED', 1: 'DRIVING', 2: 'CHARGING' };
const HEALTH_MAP = { 0: 'HEALTHY', 1: 'DEGRADING', 2: 'CRITICAL' };
const SEVERITY_MAP = { 0: 'INFO', 1: 'WARNING', 2: 'CRITICAL' };

const loadProto = async () => {
  const protoPath = path.join(__dirname, '..', '..', '..', 'vehicle-simulator', 'proto', 'telemetry.proto');
  const root = await protobuf.load(protoPath);
  TelemetryEvent = root.lookupType('vehicle.telemetry.TelemetryEvent');
  logger.info('Protobuf schema loaded');
};

const handleMessage = async (topic, payload, io) => {
  try {
    const parts = topic.split('/');
    const vehicleId = parts[1] || 'UNKNOWN';

    const decoded = TelemetryEvent.decode(payload);
    const event = TelemetryEvent.toObject(decoded, { defaults: true });

    const doc = {
      time: new Date(Number(event.timestamp)),
      vehicleId,
      state: STATE_MAP[event.state] || 'PARKED',
      speed: event.gps?.speedKmh || 0,
      latitude: event.gps?.latitude || 0,
      longitude: event.gps?.longitude || 0,
      heading: event.gps?.heading || 0,
      batterySoc: event.battery?.stateOfCharge || 0,
      batteryVoltage: event.battery?.voltage || 0,
      batteryTemp: event.battery?.temperature || 0,
      batteryCurrent: event.battery?.currentDraw || 0,
      batteryHealth: HEALTH_MAP[event.battery?.health] || 'HEALTHY',
      motorRpm: event.powertrain?.motorRpm || 0,
      motorTemp: event.powertrain?.motorTemp || 0,
      throttle: event.powertrain?.throttlePosition || 0,
      regenBraking: event.powertrain?.regenBrakingActive || false,
      dtcs: (event.dtcs || []).map(d => ({
        code: d.code,
        severity: SEVERITY_MAP[d.severity] || 'INFO',
        description: d.description,
        firstSeen: new Date(Number(d.firstSeen)),
      })),
    };

    await Telemetry.create(doc);

    await VehicleLatest.findOneAndUpdate(
      { vehicleId },
      {
        vehicleId,
        lastSeen: doc.time,
        state: doc.state,
        batterySoc: doc.batterySoc,
        batteryVoltage: doc.batteryVoltage,
        batteryTemp: doc.batteryTemp,
        batteryHealth: doc.batteryHealth,
        speed: doc.speed,
        latitude: doc.latitude,
        longitude: doc.longitude,
        activeDtcCount: doc.dtcs.length,
      },
      { upsert: true, new: true }
    );

    await alertEvaluator.evaluate(doc);

    if (io) {
      io.emit('telemetry', {
        vehicleId, state: doc.state, batterySoc: doc.batterySoc,
        batteryVoltage: doc.batteryVoltage, batteryTemp: doc.batteryTemp,
        speed: doc.speed, latitude: doc.latitude, longitude: doc.longitude,
        batteryHealth: doc.batteryHealth,
      });
    }
  } catch (err) {
    logger.error(`Failed to process message on ${topic}: ${err.message}`);
  }
};

const startConsumer = async (io) => {
  await loadProto();

  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
  const client = mqtt.connect(brokerUrl, {
    clientId: 'fleet-backend-' + Math.random().toString(16).slice(2, 8),
    reconnectPeriod: 3000,
  });

  client.on('connect', () => {
    logger.info(`MQTT connected to ${brokerUrl}`);
    client.subscribe('vehicles/+/telemetry', { qos: 1 }, (err) => {
      if (err) logger.error(`MQTT subscribe error: ${err.message}`);
      else logger.info('Subscribed to vehicles/+/telemetry');
    });
  });

  client.on('message', (topic, payload) => {
    handleMessage(topic, payload, io);
  });

  client.on('error', (err) => logger.error(`MQTT error: ${err.message}`));
  client.on('reconnect', () => logger.info('MQTT reconnecting...'));

  return client;
};

module.exports = { startConsumer };