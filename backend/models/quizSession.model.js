const mongoose = require('mongoose');

const quizSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  deck: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deck',
    required: true,
  },
  deckTitle: { type: String, required: true },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  scorePercentage: { type: Number, required: true },
  answers: [{
    question: String,
    selectedOption: String,
    correctOption: String,
    isCorrect: Boolean,
  }],
  durationSeconds: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('QuizSession', quizSessionSchema);
