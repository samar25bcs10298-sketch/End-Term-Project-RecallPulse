const Deck = require('../models/deck.model.js');
const User = require('../models/user.model.js');
const QuizSession = require('../models/quizSession.model.js');
const { extractStudyMaterial } = require('../utils/extractor.js');
const { calculateSM2 } = require('../utils/sm2.js');

// POST /api/decks/generate (Generate flashcards & quizzes from raw text)
const generateDeck = async (req, res) => {
  try {
    const { title, description, category, rawText } = req.body;

    if (!title || !rawText) {
      return res.status(400).json({ success: false, message: 'Deck title and raw text content are required' });
    }

    if (rawText.trim().length < 50) {
      return res.status(400).json({ success: false, message: 'Text is too short. Please provide at least 50 characters of study notes.' });
    }

    // Run extraction logic
    const { flashcards, mcqs } = extractStudyMaterial(rawText, title);

    if (flashcards.length === 0) {
      return res.status(400).json({ success: false, message: 'Could not extract valid concepts from text. Please try with more structured notes.' });
    }

    const newDeck = await Deck.create({
      user: req.user._id,
      title,
      description: description || '',
      category: category || 'General',
      rawSourceText: rawText,
      cards: flashcards,
      quizzes: mcqs
    });

    res.status(201).json({
      success: true,
      message: `Generated ${flashcards.length} flashcards and ${mcqs.length} quiz questions!`,
      deck: newDeck
    });
  } catch (error) {
    console.error('generateDeck error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error generating deck' });
  }
};

// GET /api/decks (List all user decks with due count)
const getDecks = async (req, res) => {
  try {
    const decks = await Deck.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, decks });
  } catch (error) {
    console.error('getDecks error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching decks' });
  }
};

// GET /api/decks/:id (Single deck details)
const getDeckById = async (req, res) => {
  try {
    const deck = await Deck.findOne({ _id: req.params.id, user: req.user._id });
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found' });
    }
    res.status(200).json({ success: true, deck });
  } catch (error) {
    console.error('getDeckById error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching deck' });
  }
};

// DELETE /api/decks/:id
const deleteDeck = async (req, res) => {
  try {
    const deck = await Deck.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found' });
    }
    res.status(200).json({ success: true, message: 'Deck deleted successfully' });
  } catch (error) {
    console.error('deleteDeck error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting deck' });
  }
};

// POST /api/decks/:deckId/cards/:cardId/review (Submit SM-2 review grade: 0 to 5)
const reviewCard = async (req, res) => {
  try {
    const { deckId, cardId } = req.params;
    const { grade } = req.body; // grade 0 - 5

    if (grade === undefined || grade < 0 || grade > 5) {
      return res.status(400).json({ success: false, message: 'Valid grade between 0 and 5 is required' });
    }

    const deck = await Deck.findOne({ _id: deckId, user: req.user._id });
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found' });
    }

    const card = deck.cards.id(cardId);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found in deck' });
    }

    // Compute next SM-2 interval & ease factor
    const sm2Result = calculateSM2({
      repetition: card.repetition,
      easeFactor: card.easeFactor,
      interval: card.interval,
      grade
    });

    card.repetition = sm2Result.repetition;
    card.easeFactor = sm2Result.easeFactor;
    card.interval = sm2Result.interval;
    card.nextReviewDate = sm2Result.nextReviewDate;
    card.lastReviewedAt = new Date();
    card.reviewCount += 1;

    await deck.save();

    // Update user retention stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'studyStats.totalReviews': 1 },
      $set: { 'studyStats.lastStudiedAt': new Date() }
    });

    res.status(200).json({
      success: true,
      message: `Card reviewed! Next review in ${sm2Result.interval} day(s).`,
      card,
      sm2: sm2Result
    });
  } catch (error) {
    console.error('reviewCard error:', error);
    res.status(500).json({ success: false, message: 'Server error during card review' });
  }
};

// POST /api/decks/:id/quiz/submit (Submit quiz session and calculate score)
const submitQuizSession = async (req, res) => {
  try {
    const { id: deckId } = req.params;
    const { answers, durationSeconds } = req.body;

    const deck = await Deck.findOne({ _id: deckId, user: req.user._id });
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found' });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Answers array is required' });
    }

    let correctCount = 0;
    const evaluatedAnswers = [];

    deck.quizzes.forEach((quiz, idx) => {
      const submittedOption = answers[idx];
      const correctOption = quiz.options[quiz.correctIndex];
      const isCorrect = submittedOption === correctOption;

      if (isCorrect) correctCount += 1;

      evaluatedAnswers.push({
        question: quiz.question,
        selectedOption: submittedOption || 'No answer',
        correctOption,
        isCorrect
      });
    });

    const scorePercentage = deck.quizzes.length > 0 
      ? Math.round((correctCount / deck.quizzes.length) * 100) 
      : 0;

    const session = await QuizSession.create({
      user: req.user._id,
      deck: deck._id,
      deckTitle: deck.title,
      totalQuestions: deck.quizzes.length,
      correctAnswers: correctCount,
      scorePercentage,
      answers: evaluatedAnswers,
      durationSeconds: durationSeconds || 0
    });

    // Update user's retention score average
    const userSessions = await QuizSession.find({ user: req.user._id });
    const avgScore = Math.round(userSessions.reduce((acc, s) => acc + s.scorePercentage, 0) / userSessions.length);

    await User.findByIdAndUpdate(req.user._id, {
      $set: { 'studyStats.retentionRate': avgScore }
    });

    res.status(200).json({
      success: true,
      session
    });
  } catch (error) {
    console.error('submitQuizSession error:', error);
    res.status(500).json({ success: false, message: 'Server error submitting quiz' });
  }
};

// GET /api/decks/analytics/overview (Aggregate retention, streak, due cards)
const getAnalyticsOverview = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const decks = await Deck.find({ user: req.user._id });
    const sessions = await QuizSession.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10);

    const now = new Date();
    let totalCards = 0;
    let dueCards = 0;
    let masteredCards = 0; // interval >= 14 days

    decks.forEach(d => {
      d.cards.forEach(c => {
        totalCards++;
        if (!c.nextReviewDate || new Date(c.nextReviewDate) <= now) {
          dueCards++;
        }
        if (c.interval >= 14) {
          masteredCards++;
        }
      });
    });

    res.status(200).json({
      success: true,
      analytics: {
        totalDecks: decks.length,
        totalCards,
        dueCards,
        masteredCards,
        totalReviews: user.studyStats.totalReviews || 0,
        retentionRate: user.studyStats.retentionRate || 100,
        streakDays: user.studyStats.streakDays || 1,
        recentSessions: sessions
      }
    });
  } catch (error) {
    console.error('getAnalyticsOverview error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching analytics' });
  }
};

module.exports = {
  generateDeck,
  getDecks,
  getDeckById,
  deleteDeck,
  reviewCard,
  submitQuizSession,
  getAnalyticsOverview
};
