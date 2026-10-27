const express = require('express');
const router = express.Router();
const protect = require('../middlewares/auth.middleware.js');
const {
  generateDeck,
  getDecks,
  getDeckById,
  deleteDeck,
  reviewCard,
  submitQuizSession,
  generateMoreQuizQuestions,
  getAnalyticsOverview
} = require('../controllers/deck.controller.js');

// All deck routes are protected
router.use(protect);

router.post('/generate', generateDeck);
router.get('/', getDecks);
router.get('/analytics/overview', getAnalyticsOverview);
router.get('/:id', getDeckById);
router.delete('/:id', deleteDeck);
router.post('/:deckId/cards/:cardId/review', reviewCard);
router.post('/:id/quiz/submit', submitQuizSession);
router.post('/:id/quiz/generate-more', generateMoreQuizQuestions);

module.exports = router;
