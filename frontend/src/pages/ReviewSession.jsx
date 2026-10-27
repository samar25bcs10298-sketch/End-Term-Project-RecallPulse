import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const SM2_GRADES = [
  { grade: 0, label: '0 - Blackout', desc: 'No recall at all', color: '#ef4444' },
  { grade: 1, label: '1 - Incorrect', desc: 'Remembered upon reveal', color: '#f97316' },
  { grade: 2, label: '2 - Hard', desc: 'Incorrect, but felt familiar', color: '#eab308' },
  { grade: 3, label: '3 - Hesitant', desc: 'Correct, with difficulty', color: '#06b6d4' },
  { grade: 4, label: '4 - Good', desc: 'Correct after hesitation', color: '#3b82f6' },
  { grade: 5, label: '5 - Perfect', desc: 'Instant, flawless recall', color: '#10b981' },
];

const ReviewSession = () => {
  const { id: deckId } = useParams();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [lastSM2Result, setLastSM2Result] = useState(null);

  useEffect(() => {
    const fetchDeck = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/decks/${deckId}`);
        if (res.data.success) {
          setDeck(res.data.deck);
          setCards(res.data.deck.cards || []);
        }
      } catch (err) {
        console.error('Error fetching deck for review:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeck();
  }, [deckId]);

  const handleGrade = async (grade) => {
    if (submitting || currentIndex >= cards.length) return;
    const currentCard = cards[currentIndex];

    try {
      setSubmitting(true);
      const res = await api.post(`/decks/${deckId}/cards/${currentCard._id}/review`, { grade });
      
      setLastSM2Result(res.data.sm2);
      setIsFlipped(false);

      if (currentIndex + 1 < cards.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setSessionCompleted(true);
      }
    } catch (err) {
      alert('Failed to log review grade');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="state-card">Loading review session...</div>;
  if (!deck) return <div className="state-card">Deck not found.</div>;
  if (cards.length === 0) return (
    <div className="state-card">
      <h3>No cards in this deck.</h3>
      <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
    </div>
  );

  if (sessionCompleted) {
    return (
      <div className="review-page">
        <div className="session-complete-card">
          <div className="complete-icon">🎉</div>
          <h2>Session Completed!</h2>
          <p>You have reviewed all <strong>{cards.length}</strong> cards in <em>{deck.title}</em>.</p>
          <p className="sm2-note">
            The SuperMemo SM-2 algorithm has updated all intervals and ease factors based on your recall grades. 
            Cards are now scheduled according to their memory decay curve.
          </p>

          <div className="complete-actions">
            <Link to={`/quiz/${deckId}`} className="btn-primary">
              🎯 Test Recall in Quiz Mode →
            </Link>
            <Link to="/dashboard" className="btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progressPercent = Math.round(((currentIndex) / cards.length) * 100);

  return (
    <div className="review-page">
      <div className="review-header">
        <div>
          <h2>🧠 SM-2 Spaced Repetition: {deck.title}</h2>
          <span className="concept-badge">{currentCard.conceptTag || 'Concept'}</span>
        </div>
        <div className="review-progress-indicator">
          <span>Card {currentIndex + 1} of {cards.length}</span>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* SM-2 Current Parameters Badge */}
      <div className="sm2-metadata-ribbon">
        <span>Current Interval: <strong>{currentCard.interval || 0}d</strong></span>
        <span>Ease Factor (EF): <strong>{currentCard.easeFactor || 2.5}</strong></span>
        <span>Repetitions: <strong>{currentCard.repetition || 0}</strong></span>
        {lastSM2Result && (
          <span className="sm2-live-notice">
            ⚡ Last SM-2 Update: +{lastSM2Result.interval}d interval (EF: {lastSM2Result.easeFactor})
          </span>
        )}
      </div>

      {/* Interactive Flip Card */}
      <div className={`flip-card-container ${isFlipped ? 'flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
        <div className="flip-card-inner">
          <div className="flip-card-front">
            <span className="card-side-label">PROMPT / QUESTION</span>
            <h3 className="card-prompt">{currentCard.question}</h3>
            <p className="card-tap-instruction">👆 Click or Tap card to reveal answer</p>
          </div>

          <div className="flip-card-back">
            <span className="card-side-label">CORRECT EXPLANATION</span>
            <p className="card-answer">{currentCard.answer}</p>
            <p className="card-tap-instruction">Grade your recall below to compute next interval</p>
          </div>
        </div>
      </div>

      {/* SM-2 Evaluation Grading Controls (Visible after flip) */}
      <div className={`grading-section ${isFlipped ? 'visible' : 'disabled'}`}>
        <h4>How well did you recall this answer?</h4>
        <div className="grades-grid">
          {SM2_GRADES.map((g) => (
            <button
              key={g.grade}
              type="button"
              disabled={!isFlipped || submitting}
              onClick={() => handleGrade(g.grade)}
              className="btn-grade"
              style={{ borderColor: g.color }}
            >
              <span className="grade-title" style={{ color: g.color }}>{g.label}</span>
              <span className="grade-desc">{g.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewSession;
