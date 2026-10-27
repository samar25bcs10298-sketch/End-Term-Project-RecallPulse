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

  // Generating more state
  const [generatingMore, setGeneratingMore] = useState(false);
  const [generateMsg, setGenerateMsg] = useState('');
  const [generateErr, setGenerateErr] = useState('');

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

  const handleGenerateMore = async () => {
    try {
      setGeneratingMore(true);
      setGenerateMsg('');
      setGenerateErr('');

      const res = await api.post(`/decks/${deckId}/quiz/generate-more`);
      if (res.data.success) {
        setQuizzes([...quizzes, ...res.data.newQuizzes]);
        setGenerateMsg(`✨ Added ${res.data.newQuizzes.length} new scenario questions!`);
        // If already submitted, reset submission so user can test the newly added questions
        if (submitted) {
          setSubmitted(false);
          setResultSession(null);
        }
      }
    } catch (err) {
      setGenerateErr(err.response?.data?.message || 'Could not generate more questions for these notes.');
    } finally {
      setGeneratingMore(false);
    }
  };

  if (loading) return <div className="state-card">Loading generated quiz...</div>;
  if (!deck) return <div className="state-card">Deck not found.</div>;
  if (quizzes.length === 0) return (
    <div className="state-card">
      <h3>No quizzes generated for this deck yet.</h3>
      <button onClick={handleGenerateMore} disabled={generatingMore} className="btn-primary mt-1">
        {generatingMore ? 'Synthesizing Questions...' : '+ Generate 5 Practice Questions'}
      </button>
      <div style={{ marginTop: '1rem' }}>
        <Link to="/dashboard" className="btn-secondary">Back to Dashboard</Link>
      </div>
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
          <p>{quizzes.length} Questions • Instant Validation & Multi-Angle Synthesis</p>
        </div>
        <div className="quiz-timer-badge">
          ⏱ Time: <strong>{formatTimer(seconds)}</strong>
        </div>
      </div>

      {generateMsg && <div className="alert-success-banner">{generateMsg}</div>}
      {generateErr && <div className="alert-error">{generateErr}</div>}

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
              <button
                type="button"
                onClick={handleGenerateMore}
                disabled={generatingMore}
                className="btn-action-more"
              >
                {generatingMore ? 'Synthesizing...' : '⚡ Generate 5 More Questions'}
              </button>
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

      <div className="quiz-action-bar">
        {!submitted && (
          <button
            type="button"
            onClick={handleSubmitQuiz}
            disabled={submitting}
            className="btn-primary-large"
          >
            {submitting ? 'Evaluating...' : `Submit Quiz (${Object.keys(selectedAnswers).length}/${quizzes.length} Answered)`}
          </button>
        )}

        <button
          type="button"
          onClick={handleGenerateMore}
          disabled={generatingMore}
          className="btn-generate-more-secondary"
        >
          {generatingMore ? 'Synthesizing...' : '+ Generate 5 More Questions'}
        </button>
      </div>
    </div>
  );
};

export default QuizMode;
