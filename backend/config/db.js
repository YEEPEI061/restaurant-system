const mongoose = require('mongoose');

async function connectDatabase(uri = process.env.MONGO_URI) {
  if (!uri) {
    throw new Error('MONGO_URI is not configured');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000
  });

  console.log('MongoDB connected');
}

async function disconnectDatabase() {
  await mongoose.disconnect();
}

module.exports = {
  connectDatabase,
  disconnectDatabase
};