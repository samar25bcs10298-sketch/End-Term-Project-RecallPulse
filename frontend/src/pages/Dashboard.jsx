import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/decks');
      if (res.data.success) {
        setDecks(res.data.decks);
      }
    } catch (err) {
      setError('Failed to load study decks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this deck?')) return;
    try {
      setDeleteId(id);
      await api.delete(`/decks/${id}`);
      setDecks(decks.filter(d => d._id !== id));
    } catch (err) {
      alert('Failed to delete deck');
    } finally {
      setDeleteId(null);
    }
  };

  // Calculate totals
  const totalCards = decks.reduce((sum, d) => sum + (d.cards?.length || 0), 0);
  const totalDue = decks.reduce((sum, d) => sum + (d.dueCardCount || 0), 0);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h2>Welcome, {user?.name}!</h2>
          <p className="subtitle">Manage your study decks and maintain your spaced repetition schedule</p>
        </div>
        <Link to="/create" className="btn-primary">
          + Ingest New Notes
        </Link>
      </div>

      {/* Quick Stat Ribbon */}
      <div className="stats-ribbon">
        <div className="stat-box">
          <span className="stat-label">Total Decks</span>
          <span className="stat-value">{decks.length}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Total Flashcards</span>
          <span className="stat-value">{totalCards}</span>
        </div>
        <div className="stat-box highlight-due">
          <span className="stat-label">Cards Due Today</span>
          <span className="stat-value">{totalDue}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Retention Score</span>
          <span className="stat-value">{user?.studyStats?.retentionRate || 100}%</span>
        </div>
      </div>

      {loading && <div className="state-card">Loading study decks...</div>}
      {error && <div className="alert-error">{error}</div>}

      {!loading && decks.length === 0 && (
        <div className="empty-state-card">
          <div className="empty-icon">📚</div>
          <h3>No Study Decks Yet</h3>
          <p>Paste your first set of lecture notes or markdown to extract flashcards and quizzes instantly.</p>
          <Link to="/create" className="btn-primary">
            Ingest Your First Note →
          </Link>
        </div>
      )}

      {/* Decks Grid */}
      <div className="decks-grid">
        {decks.map((deck) => (
          <div key={deck._id} className="deck-card">
            <div className="deck-card-top">
              <span className="deck-category">{deck.category}</span>
              {deck.dueCardCount > 0 ? (
                <span className="due-badge">{deck.dueCardCount} Due</span>
              ) : (
                <span className="up-to-date-badge">✓ Caught Up</span>
              )}
            </div>

            <h3 className="deck-title">{deck.title}</h3>
            {deck.description && <p className="deck-description">{deck.description}</p>}

            <div className="deck-meta">
              <span>🃏 {deck.cards?.length || 0} Cards</span>
              <span>📝 {deck.quizzes?.length || 0} Quizzes</span>
            </div>

            <div className="deck-actions">
              <Link to={`/review/${deck._id}`} className="btn-action-review" title="SM-2 Flashcard Review">
                🧠 Review SM-2
              </Link>
              {deck.quizzes?.length > 0 && (
                <Link to={`/quiz/${deck._id}`} className="btn-action-quiz" title="Take Timed Quiz">
                  🎯 Quiz Mode
                </Link>
              )}
              <button
                onClick={() => handleDelete(deck._id)}
                disabled={deleteId === deck._id}
                className="btn-action-delete"
                title="Delete Deck"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
