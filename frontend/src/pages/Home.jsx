import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-badge">🧬 SuperMemo SM-2 Spaced Repetition Engine</div>
        <h1 className="hero-title">
          Turn Raw Study Notes into <br />
          <span className="gradient-text">Long-Term Mastery</span>
        </h1>
        <p className="hero-subtitle">
          Passive reading leads to rapid forgetting. RecallPulse extracts conceptual flashcards & quizzes 
          directly from your study notes and schedules review sessions using the scientifically validated 
          <strong> SM-2 Spaced Repetition algorithm</strong>.
        </p>

        <div className="hero-cta-group">
          {user ? (
            <Link to="/dashboard" className="btn-hero-primary">
              Open Your Study Workspace →
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-hero-primary">
                Start Learning for Free →
              </Link>
              <Link to="/login" className="btn-hero-secondary">
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">📝</div>
          <h3>1. Instant Note Ingestion</h3>
          <p>
            Paste lecture notes, markdown summaries, or documentation. The deterministic NLP rule engine automatically extracts key concepts, definitions, and active recall questions.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🧠</div>
          <h3>2. SM-2 Spaced Repetition</h3>
          <p>
            Review cards and grade your recall from 0 (Blackout) to 5 (Perfect). The algorithm dynamically recalculates Ease Factors and schedules the optimal future review date.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🎯</div>
          <h3>3. Timed Quiz Validation</h3>
          <p>
            Reinforce knowledge with automatically generated 4-option multiple choice questions, instant feedback, and detailed conceptual explanations.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>4. Retention Analytics</h3>
          <p>
            Track your retention trajectory, study streaks, mastered cards, and deck completion metrics to guarantee exam readiness.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
