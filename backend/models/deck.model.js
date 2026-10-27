const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  conceptTag: { type: String, default: 'General' },
  
  // SM-2 Spaced Repetition Parameters
  repetition: { type: Number, default: 0 },
  interval: { type: Number, default: 0 }, // days
  easeFactor: { type: Number, default: 2.5 },
  nextReviewDate: { type: Date, default: Date.now },
  lastReviewedAt: { type: Date, default: null },
  reviewCount: { type: Number, default: 0 }
});

const mcqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  explanation: { type: String }
});

const deckSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Deck title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    default: 'Computer Science',
    enum: ['Computer Science', 'Web Development', 'System Design', 'Algorithms', 'General']
  },
  rawSourceText: {
    type: String,
    default: ''
  },
  cards: [flashcardSchema],
  quizzes: [mcqSchema]
}, { timestamps: true });

// Virtual to count how many cards in this deck are due for review right now
deckSchema.virtual('dueCardCount').get(function() {
  const now = new Date();
  return (this.cards || []).filter(c => !c.nextReviewDate || new Date(c.nextReviewDate) <= now).length;
});

deckSchema.set('toJSON', { virtuals: true });
deckSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Deck', deckSchema);
