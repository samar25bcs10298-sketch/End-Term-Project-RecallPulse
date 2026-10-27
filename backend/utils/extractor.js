const { GoogleGenAI } = require('@google/genai');

/**
 * Intelligent AI Extractor powered by Google Gemini
 * 
 * Takes unstructured notes, markdown summaries, or textbooks and extracts:
 * 1. High-Yield Flashcards (Concept, Natural Prompt, Precise Complete Explanation)
 * 2. 4-Option Multiple Choice Questions (with realistic distractors and explanations)
 * 
 * Falls back gracefully to deterministic parsing if API key is not present.
 */

async function extractStudyMaterial(rawText, deckTitle = 'Study Deck') {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Valid text content is required for generation');
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are an expert academic tutor and cognitive scientist.
Analyze the following study notes and extract:
1. High-yield flashcards for active recall. Every question must be a natural, clear question (e.g. "What is Regression in machine learning?", "What is the primary function of the Fallopian Tubes?"). Never use meta-questions like "What is Key Concept 1?" or "What is The Core Learning Paradigms?".
Every answer must be a complete, grammatically sound, comprehensive explanation.
2. 4-option multiple choice questions (MCQs) that test deep conceptual understanding, complete with 4 distinct options, the correct index (0-3), and a clear explanation.

Study Notes:
"""
${rawText}
"""

You MUST respond strictly with valid JSON conforming to this schema (no extra text, no markdown backticks, just raw JSON):
{
  "flashcards": [
    {
      "question": "Clear, natural question",
      "answer": "Complete, accurate explanation",
      "conceptTag": "Short concept topic name"
    }
  ],
  "mcqs": [
    {
      "question": "Conceptual question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this is correct"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text.trim();
      const parsed = JSON.parse(responseText);

      if (parsed.flashcards && Array.isArray(parsed.flashcards) && parsed.flashcards.length > 0) {
        return {
          flashcards: parsed.flashcards.slice(0, 20),
          mcqs: (parsed.mcqs || []).slice(0, 10)
        };
      }
    } catch (err) {
      console.warn('Gemini extraction failed, falling back to local extractor:', err.message);
    }
  }

  // Fallback: Rule-based heuristic extraction
  return fallbackRuleExtractor(rawText, deckTitle);
}

function fallbackRuleExtractor(rawText, deckTitle) {
  const sanitized = rawText
    .replace(/[┌┐└┘├┤─│┼]/g, '')
    .trim();

  const lines = sanitized.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const flashcards = [];
  const mcqs = [];

  const colonRegex = /^[\s•\-\*\d\.\)]*\s*([^:\n—–]{2,45})\s*[:—–]\s*(.+)$/;

  for (const line of lines) {
    const match = line.match(colonRegex);
    if (match) {
      const subject = match[1].replace(/^[\s•\-\*\d\.\)\(]+/, '').replace(/[\(\[].*?[\)\]]/g, '').trim();
      const definition = match[2].trim();

      if (subject.length >= 2 && subject.length <= 40 && definition.length >= 15) {
        flashcards.push({
          question: `Explain the concept of ${subject}:`,
          answer: `${subject} refers to: ${definition}`,
          conceptTag: subject
        });
      }
    }
  }

  return {
    flashcards: flashcards.slice(0, 15),
    mcqs: []
  };
}

module.exports = { extractStudyMaterial };
