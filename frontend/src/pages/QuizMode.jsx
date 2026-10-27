import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const QuizMode = () => {
  const { id: deckId } = useParams();
  const [deck, setDeck] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [resultSession, setResultSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/decks/${deckId}`);
        if (res.data.success) {
          setDeck(res.data.deck);
          setQuizzes(res.data.deck.quizzes || []);
        }
      } catch (err) {
        console.error('Error fetching quiz deck:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [deckId]);

  // Timer
  useEffect(() => {
    if (submitted || loading) return;
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted, loading]);

  const handleSelectOption = (qIdx, option) => {
    if (submitted) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [qIdx]: option
    });
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(selectedAnswers).length < quizzes.length) {
      if (!window.confirm('You have unanswered questions. Are you sure you want to submit?')) {
        return;
      }
    }

    try {
      setSubmitting(true);
      const answersArray = quizzes.map((_, idx) => selectedAnswers[idx] || '');

      const res = await api.post(`/decks/${deckId}/quiz/submit`, {
        answers: answersArray,
        durationSeconds: seconds
      });

      if (res.data.success) {
        setResultSession(res.data.session);
        setSubmitted(true);
      }
    } catch (err) {
      alert('Failed to evaluate quiz session.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="state-card">Loading generated quiz...</div>;
  if (!deck) return <div className="state-card">Deck not found.</div>;
  if (quizzes.length === 0) return (
    <div className="state-card">
      <h3>No quizzes generated for this deck.</h3>
      <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
    </div>
  );

  const formatTimer = (totalSec) => {
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="quiz-page">
      <div className="quiz-header">
        <div>
          <h2>🎯 Active Recall Quiz: {deck.title}</h2>
          <p>{quizzes.length} Questions • Instant Validation & Explanations</p>
        </div>
        <div className="quiz-timer-badge">
          ⏱ Time: <strong>{formatTimer(seconds)}</strong>
        </div>
      </div>

      {submitted && resultSession && (
        <div className="quiz-score-banner">
          <div className="score-circle">
            <span className="score-number">{resultSession.scorePercentage}%</span>
            <span className="score-sub">{resultSession.correctAnswers}/{resultSession.totalQuestions} Correct</span>
          </div>
          <div className="score-feedback">
            <h3>{resultSession.scorePercentage >= 80 ? '🌟 Outstanding Recall!' : resultSession.scorePercentage >= 50 ? '👍 Solid Effort!' : '📖 Needs Review'}</h3>
            <p>Your session stats and mastery trajectory have been persisted to your profile analytics.</p>
            <div className="score-action-btns">
              <Link to={`/review/${deckId}`} className="btn-primary">
                🧠 Review SM-2 Flashcards
              </Link>
              <Link to="/analytics" className="btn-secondary">
                View Retention Analytics
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="quiz-questions-list">
        {quizzes.map((q, idx) => {
          const selected = selectedAnswers[idx];
          const evaluated = resultSession?.answers[idx];

          return (
            <div key={idx} className={`quiz-card ${submitted ? (evaluated?.isCorrect ? 'card-correct' : 'card-incorrect') : ''}`}>
              <div className="quiz-card-header">
                <span className="question-num">Question {idx + 1}</span>
                {submitted && (
                  <span className={`status-pill ${evaluated?.isCorrect ? 'pill-success' : 'pill-danger'}`}>
                    {evaluated?.isCorrect ? '✓ Correct' : '✕ Incorrect'}
                  </span>
                )}
              </div>

              <h3 className="quiz-question-text">{q.question}</h3>

              <div className="quiz-options-grid">
                {q.options.map((opt, oIdx) => {
                  let optClass = 'quiz-option-btn';
                  if (selected === opt) optClass += ' selected';
                  if (submitted) {
                    if (opt === q.options[q.correctIndex]) optClass += ' option-correct';
                    else if (selected === opt && !evaluated?.isCorrect) optClass += ' option-wrong';
                  }

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleSelectOption(idx, opt)}
                      className={optClass}
                    >
                      <span className="opt-letter">{String.fromCharCode(65 + oIdx)}.</span>
                      <span className="opt-text">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {submitted && q.explanation && (
                <div className="quiz-explanation-box">
                  <strong>Explanation:</strong> {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <div className="quiz-submit-bar">
          <button
            type="button"
            onClick={handleSubmitQuiz}
            disabled={submitting}
            className="btn-primary-large"
          >
            {submitting ? 'Evaluating...' : `Submit Quiz (${Object.keys(selectedAnswers).length}/${quizzes.length} Answered)`}
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizMode;
