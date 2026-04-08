const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fleet';

  try {
    await mongoose.connect(uri);
    logger.info(`MongoDB connected: ${uri}`);

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const names = collections.map(c => c.name);

    if (!names.includes('telemetry')) {
      await db.createCollection('telemetry', {
        timeseries: {
          timeField: 'time',
          metaField: 'vehicleId',
          granularity: 'seconds',
        },
        expireAfterSeconds: 604800,
      });
      logger.info('Created time-series collection: telemetry');
    }
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;