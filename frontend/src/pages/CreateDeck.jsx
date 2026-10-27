import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const SAMPLE_NOTES = `
REST API: A set of architectural principles for transferring representations of resources between client and server over HTTP.
Statelessness - Every HTTP request must contain all contextual information required for processing, without relying on server-side session memory.
Idempotence: An operation is considered idempotent if performing it multiple times yields the exact same outcome as a single execution.
JWT (JSON Web Token) - An open industry standard (RFC 7519) for securely transmitting claims between parties as a compact, self-contained JSON object.
HMAC SHA256 is used for cryptographic verification of digital signatures to protect message integrity against tampering.
SuperMemo SM-2 refers to the spaced repetition algorithm that optimizes review intervals based on user recall quality.
`;

const CreateDeck = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Computer Science');
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleUseSample = () => {
    setTitle('Web Architecture & Cryptography');
    setDescription('Fundamental networking, security protocols, and memory algorithms.');
    setCategory('Computer Science');
    setRawText(SAMPLE_NOTES.trim());
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !rawText.trim()) {
      setError('Please provide a deck title and paste your study notes.');
      return;
    }

    if (rawText.trim().length < 40) {
      setError('Notes are too short. Please provide at least 40 characters for concept extraction.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/decks/generate', {
        title,
        description,
        category,
        rawText
      });

      if (res.data.success) {
        navigate(`/review/${res.data.deck._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to extract study materials from notes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-deck-page">
      <div className="create-deck-card">
        <div className="create-deck-header">
          <h2>⚡ Ingest Notes & Extract Material</h2>
          <p>Paste your unstructured notes or markdown. The NLP rule engine will parse terms and generate active recall cards and multiple-choice quizzes automatically.</p>
          <button type="button" onClick={handleUseSample} className="btn-sample-notes">
            📋 Load Sample Notes Template
          </button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleGenerate} className="create-form">
          <div className="form-row">
            <div className="form-group flex-2">
              <label>Deck Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed Systems & Concurrency"
                required
              />
            </div>

            <div className="form-group flex-1">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Computer Science">Computer Science</option>
                <option value="Web Development">Web Development</option>
                <option value="System Design">System Design</option>
                <option value="Algorithms">Algorithms</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Short Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of module or exam unit"
            />
          </div>

          <div className="form-group">
            <label>Raw Study Notes / Lecture Summary *</label>
            <textarea
              rows="12"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste definition lists (Term: Definition), lecture summaries, or markdown notes here..."
              required
            ></textarea>
            <span className="field-hint">
              Tip: Works best with definition lists (e.g. "Term: Definition"), bullet points, or conceptual paragraphs.
            </span>
          </div>

          <div className="create-actions">
            <button type="submit" className="btn-primary-large" disabled={loading}>
              {loading ? 'Analyzing & Extracting...' : '🚀 Extract Flashcards & Quizzes →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDeck;
