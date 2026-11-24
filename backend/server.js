const http = require('http');

require('dotenv').config();

const app = require('./app');

const { connectDatabase } = require('./config/db');

const {
  initialiseSampleData
} = require('./services/sampleDataService');

const {
  startReservationStatusScheduler
} = require('./services/reservationStatusScheduler');

const {
  initializeWebSocket,
  closeWebSocket
} = require('./services/websocketService');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

initializeWebSocket(server);

async function startServer() {
  try {
    await connectDatabase();

    await initialiseSampleData();

    startReservationStatusScheduler();

    server.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      `Failed to start server: ${error.message}`
    );

    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  console.log(`${signal} received. Starting graceful shutdown...`);

  try {
    await closeWebSocket();

    console.log('WebSocket connections closed.');

    server.close(async (error) => {
      if (error) {
        console.error('Error during server shutdown:', error);
        process.exit(1);
      }

      console.log('All ongoing HTTP requests have completed.');

      try {
        const mongoose = require('mongoose');
        await mongoose.disconnect();

        console.log('MongoDB connection closed.');
        process.exit(0);
      } catch (shutdownError) {
        console.error('Error closing MongoDB:', shutdownError);
        process.exit(1);
      }
    });

  } catch (shutdownError) {
    console.error('Error during graceful shutdown:', shutdownError);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));


void startServer();