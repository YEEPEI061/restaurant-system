const http = require('http');

require('dotenv').config();

const app = require('./app');

const { connectDatabase } = require('./config/db');

const {
  initializeWebSocket
} = require('./services/websocketService');

const {
  initialiseSampleData
} = require('./services/sampleDataService');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

initializeWebSocket(server);

async function startServer() {
  try {
    await connectDatabase();

    await initialiseSampleData();

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

void startServer();