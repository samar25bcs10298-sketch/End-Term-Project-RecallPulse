const Groq = require('groq-sdk');

/**
 * Intelligent Academic Material Extractor powered by Groq (openai/gpt-oss-120b)
 * 
 * Takes unstructured study notes and extracts:
 * 1. High-yield flashcards with natural, clear questions and comprehensive explanations.
 * 2. Conceptual 4-option multiple choice questions with realistic distractors and explanations.
 */

async function extractStudyMaterial(rawText, deckTitle = 'Study Deck') {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Valid text content is required for generation');
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (apiKey) {
    try {
      const groq = new Groq({ apiKey });

      const prompt = `You are an expert academic tutor and cognitive scientist.
Analyze the following study notes and extract:
1. High-yield flashcards for active recall. Every question MUST be a natural, clear question (e.g. "What is Regression in machine learning and what is its goal?", "What is the primary function of the Fallopian Tubes?"). Never create meta-questions like "What is Key Concept 1?" or "What is The Core Learning Paradigms?".
Every answer MUST be a complete, grammatically sound, comprehensive explanation.
2. 4-option multiple choice questions (MCQs) that test conceptual understanding, complete with 4 distinct options, the correct index (0-3), and an explanation.

Study Notes:
"""
${rawText}
"""

You MUST respond strictly with valid JSON conforming to this schema (no markdown backticks, no markdown prefix, just pure raw JSON):
{
  "flashcards": [
    {
      "question": "Natural, clear question text",
      "answer": "Complete, accurate explanation",
      "conceptTag": "Short concept name"
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

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an academic JSON generator. You output only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        model: 'openai/gpt-oss-120b',
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const responseText = chatCompletion.choices[0].message.content.trim();
      const parsed = JSON.parse(responseText);

      if (parsed.flashcards && Array.isArray(parsed.flashcards) && parsed.flashcards.length > 0) {
        return {
          flashcards: parsed.flashcards.slice(0, 25),
          mcqs: (parsed.mcqs || []).slice(0, 12)
        };
      }
    } catch (err) {
      console.warn('Groq extraction error, falling back to local extractor:', err.message);
    }
  }

  // Fallback: Rule-based heuristic extraction
  return fallbackRuleExtractor(rawText, deckTitle);
}

function fallbackRuleExtractor(rawText, deckTitle) {
  const sanitized = rawText.replace(/[┌┐└┘├┤─│┼]/g, '').trim();
  const lines = sanitized.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const flashcards = [];

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
