const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  studyStats: {
    totalReviews: { type: Number, default: 0 },
    streakDays: { type: Number, default: 1 },
    lastStudiedAt: { type: Date, default: Date.now },
    retentionRate: { type: Number, default: 100 }, // percentage
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
