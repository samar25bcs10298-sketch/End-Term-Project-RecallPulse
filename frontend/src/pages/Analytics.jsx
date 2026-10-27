import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/decks/analytics/overview');
        if (res.data.success) {
          setData(res.data.analytics);
        }
      } catch (err) {
        setError('Failed to fetch analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="state-card">Loading retention metrics...</div>;
  if (error) return <div className="alert-error">{error}</div>;

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h2>📊 Spaced Repetition Mastery Analytics</h2>
        <p>Insights into memory consolidation, ease factors, and quiz performance</p>
      </div>

      {/* Main KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-title">Retention Rate</span>
          <div className="kpi-number-row">
            <span className="kpi-big-number">{data.retentionRate}%</span>
            <span className="kpi-subtext">Average score across quizzes</span>
          </div>
          <div className="kpi-progress-bar">
            <div className="kpi-progress-fill" style={{ width: `${data.retentionRate}%` }}></div>
          </div>
        </div>

        <div className="kpi-card">
          <span className="kpi-title">Active Flashcards</span>
          <div className="kpi-number-row">
            <span className="kpi-big-number">{data.totalCards}</span>
            <span className="kpi-subtext">Across {data.totalDecks} study decks</span>
          </div>
          <div className="kpi-tag-row">
            <span className="tag-due">{data.dueCards} Due Today</span>
            <span className="tag-mastered">{data.masteredCards} Mastered (&gt;14d)</span>
          </div>
        </div>

        <div className="kpi-card">
          <span className="kpi-title">Total SM-2 Reviews</span>
          <div className="kpi-number-row">
            <span className="kpi-big-number">{data.totalReviews}</span>
            <span className="kpi-subtext">Algorithm evaluations completed</span>
          </div>
          <div className="kpi-tag-row">
            <span className="tag-streak">🔥 {data.streakDays} Day Study Streak</span>
          </div>
        </div>
      </div>

      {/* Recent Quiz Sessions Table */}
      <div className="recent-sessions-card">
        <h3>Recent Exam & Quiz Sessions</h3>
        {data.recentSessions.length === 0 ? (
          <p className="no-sessions-text">No quiz sessions recorded yet. Take a quiz to populate your history.</p>
        ) : (
          <div className="sessions-table-wrapper">
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>Deck Name</th>
                  <th>Questions</th>
                  <th>Correct</th>
                  <th>Score</th>
                  <th>Duration</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSessions.map((session) => (
                  <tr key={session._id}>
                    <td><strong>{session.deckTitle}</strong></td>
                    <td>{session.totalQuestions}</td>
                    <td>{session.correctAnswers}</td>
                    <td>
                      <span className={`score-pill ${session.scorePercentage >= 70 ? 'pill-high' : 'pill-low'}`}>
                        {session.scorePercentage}%
                      </span>
                    </td>
                    <td>{session.durationSeconds}s</td>
                    <td>{new Date(session.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
