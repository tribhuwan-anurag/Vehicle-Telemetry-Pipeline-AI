const express = require('express');
const axios = require('axios');
const logger = require('../utils/logger');
const router = express.Router();

const AI_BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

router.post('/ai/analyze/:vehicleId', async (req, res) => {
  try {
    const response = await axios.post(`${AI_BASE_URL}/ai/analyze/${req.params.vehicleId}`, {}, { timeout: 30000 });
    res.json(response.data);
  } catch (err) {
    logger.error(`AI analyze failed: ${err.message}`);
    res.status(503).json({ error: 'AI service unavailable', detail: err.message });
  }
});

router.post('/ai/predict/:vehicleId', async (req, res) => {
  try {
    const response = await axios.post(`${AI_BASE_URL}/ai/predict/${req.params.vehicleId}`, {}, { timeout: 30000 });
    res.json(response.data);
  } catch (err) {
    logger.error(`AI predict failed: ${err.message}`);
    res.status(503).json({ error: 'AI service unavailable', detail: err.message });
  }
});

router.post('/ai/explain-dtc/:vehicleId/:dtcCode', async (req, res) => {
  try {
    const { vehicleId, dtcCode } = req.params;
    const response = await axios.post(`${AI_BASE_URL}/ai/explain-dtc/${vehicleId}/${dtcCode}`, {}, { timeout: 30000 });
    res.json(response.data);
  } catch (err) {
    logger.error(`AI explain-dtc failed: ${err.message}`);
    res.status(503).json({ error: 'AI service unavailable', detail: err.message });
  }
});

module.exports = router;