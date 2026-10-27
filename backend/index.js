const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes.js');
const deckRoutes = require('./routes/deck.routes.js');

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, curl, mobile or evaluator browsers
    if (!origin) return callback(null, true);
    // Allow configured CLIENT_URL, localhost, and Vercel deployments
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/decks', deckRoutes);

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    project: 'RecallPulse API - Intelligent Spaced Repetition Engine',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recallpulse';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully to RecallPulse DB');
    app.listen(PORT, () => {
      console.log(`RecallPulse Backend Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err);
  });
