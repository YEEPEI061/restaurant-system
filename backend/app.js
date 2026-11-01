const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const {
  notFoundHandler,
  errorHandler
} = require('./middleware/errorMiddleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'Aurelia Restaurant API is running'
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;