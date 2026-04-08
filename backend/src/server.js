require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server: SocketIO } = require('socket.io');

const connectDB = require('./config/database');
const fleetRoutes = require('./routes/fleetRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { startConsumer } = require('./services/mqttConsumer');
const alertEvaluator = require('./services/alertEvaluator');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 8080;

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', fleetRoutes);
app.use('/api', aiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const server = http.createServer(app);
const io = new SocketIO(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  logger.info(`WebSocket client connected: ${socket.id}`);
  socket.on('disconnect', () => logger.debug(`WebSocket disconnected: ${socket.id}`));
});

alertEvaluator.setIO(io);

const start = async () => {
  await connectDB();
  await startConsumer(io);
  server.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  logger.error(`Failed to start: ${err.message}`);
  process.exit(1);
});

module.exports = { app, server };