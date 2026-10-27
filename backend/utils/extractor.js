/**
 * Precision Material Extractor for Flashcards & Quizzes
 * 
 * Supports:
 * 1. Heading + Definition paragraphs (e.g. "Support Vector Machines\nFinds the optimal hyperplane...")
 * 2. Bullet lists with colons (e.g. "• Regression: The target variable y is continuous...")
 * 3. Grammatical auto-completion (turns fragments like "Grouping similar..." into complete definitions)
 * 4. Strips LaTeX/ASCII diagrams and table noise
 */

function cleanTerm(term) {
  if (!term) return '';
  return term
    .replace(/^[\s•\-\*\d\.\)\(]+/, '') // strip leading bullets, numbers, dashes
    .replace(/[\(\[].*?[\)\]]/g, '')     // strip parenthetical info for cleaner question title
    .trim();
}

function formatCompleteAnswer(term, definition) {
  let cleanDef = definition.trim();
  // Strip redundant leading "is a", "refers to"
  cleanDef = cleanDef.replace(/^(is\s+(a|an|the)?|refers\s+to|are\s+)/i, '').trim();

  // If definition starts with a lowercase or participle ("grouping", "used to", "the target"),
  // make it a natural complete sentence:
  const firstWord = cleanDef.split(' ')[0].toLowerCase();
  
  if (['grouping', 'predicting', 'dividing', 'finding', 'training', 'identifying', 'handling'].includes(firstWord)) {
    return `${term} is the process of ${cleanDef.charAt(0).toLowerCase() + cleanDef.slice(1)}`;
  }
  
  if (['the', 'a', 'an'].includes(firstWord)) {
    return `${term}: ${cleanDef}`;
  }

  if (firstWord.startsWith('used')) {
    return `${term} is ${cleanDef.charAt(0).toLowerCase() + cleanDef.slice(1)}`;
  }

  return `${term} refers to: ${cleanDef}`;
}

function extractStudyMaterial(rawText, deckTitle = 'Study Deck') {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Valid text content is required for generation');
  }

  // Pre-clean: strip ASCII art boxes / tables / lines
  const sanitized = rawText
    .replace(/[┌┐└┘├┤─│┼]/g, '') // strip ASCII box borders
    .replace(/\\\(.*?\\\)/g, (match) => match.replace(/[\\(\)]/g, '')) // clean \( \) LaTeX tags
    .trim();

  const lines = sanitized.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

  const flashcards = [];
  const mcqs = [];

  // Pattern 1: Heading followed by a descriptive paragraph
  // Example:
  // "Logistic Regression"
  // "Despite its name, this is a linear classification algorithm..."
  for (let i = 0; i < lines.length - 1; i++) {
    const current = lines[i];
    const next = lines[i + 1];

    const isHeading = 
      current.length >= 3 && 
      current.length <= 40 && 
      !current.includes(':') && 
      !current.endsWith('.') &&
      !current.startsWith('•') &&
      !current.startsWith('-');

    const isExplanation = 
      next.length >= 30 && 
      !next.startsWith('•') && 
      !next.startsWith('-') &&
      !next.includes('┌') &&
      (next.includes(' algorithm') || next.includes(' is ') || next.includes(' used to ') || next.includes(' technique') || next.includes(' method'));

    if (isHeading && isExplanation) {
      const term = cleanTerm(current);
      if (term.length >= 3 && !['method type', 'underfitting', 'overfitting'].includes(term.toLowerCase())) {
        flashcards.push({
          question: `What is ${term} and how does it work?`,
          answer: `${term} — ${next}`,
          conceptTag: term
        });
      }
    }
  }

  // Pattern 2: Line with "• Term: Definition"
  const colonRegex = /^[\s•\-\*\d\.\)]*\s*([^:\n—–]{2,45})\s*[:—–]\s*(.+)$/;

  for (const line of lines) {
    const match = line.match(colonRegex);
    if (match) {
      const rawSubject = match[1].trim();
      const definition = match[2].trim();
      const subject = cleanTerm(rawSubject);

      if (
        subject.length >= 2 &&
        subject.length <= 40 &&
        definition.length >= 15 &&
        !subject.toLowerCase().startsWith('http') &&
        !['note', 'tip', 'phase', 'days', 'step', 'mechanism', 'pros/cons', 'loss function', 'sigmoid formula'].includes(subject.toLowerCase())
      ) {
        let questionText = `What is ${subject}?`;
        if (subject.toLowerCase().includes('regression') || subject.toLowerCase().includes('classification') || subject.toLowerCase().includes('clustering')) {
          questionText = `Define ${subject} in Machine Learning:`;
        } else if (definition.toLowerCase().includes('technique') || definition.toLowerCase().includes('algorithm')) {
          questionText = `Explain the concept of ${subject}:`;
        }

        const completeAnswer = formatCompleteAnswer(subject, definition);

        flashcards.push({
          question: questionText,
          answer: completeAnswer,
          conceptTag: subject
        });
      }
    }
  }

  // Deduplicate flashcards by conceptTag
  const uniqueFlashcards = [];
  const seenConcepts = new Set();

  for (const f of flashcards) {
    const key = f.conceptTag.toLowerCase();
    if (!seenConcepts.has(key)) {
      seenConcepts.add(key);
      uniqueFlashcards.push(f);
    }
  }

  // Generate MCQs with distinct options
  for (let i = 0; i < uniqueFlashcards.length && i < 12; i++) {
    const target = uniqueFlashcards[i];
    const correctAnswer = target.answer.length > 110 ? target.answer.slice(0, 105) + '...' : target.answer;
    
    const otherAnswers = uniqueFlashcards
      .filter((_, idx) => idx !== i)
      .map(f => f.answer.length > 110 ? f.answer.slice(0, 105) + '...' : f.answer);

    const options = [correctAnswer];

    while (options.length < 4 && otherAnswers.length > 0) {
      const randIdx = Math.floor(Math.random() * otherAnswers.length);
      const picked = otherAnswers.splice(randIdx, 1)[0];
      if (!options.includes(picked)) {
        options.push(picked);
      }
    }

    const fallbackDistractors = [
      'Trains an agent to maximize cumulative rewards through reinforcement policy gradient updates.',
      'Maximizes data purity strictly using variance reduction for non-continuous targets.',
      'Minimizes the distance between support vectors across orthogonal hyperplanes.',
      'A non-linear kernel transformation that maps inputs to zero-dimensional manifolds.'
    ];

    while (options.length < 4) {
      const fb = fallbackDistractors.pop();
      if (!options.includes(fb)) {
        options.push(fb);
      }
    }

    const shuffledOptions = options.sort(() => Math.random() - 0.5);
    const correctIndex = shuffledOptions.indexOf(correctAnswer);

    mcqs.push({
      question: target.question,
      options: shuffledOptions,
      correctIndex,
      explanation: target.answer
    });
  }

  return {
    flashcards: uniqueFlashcards.slice(0, 25),
    mcqs: mcqs.slice(0, 12)
  };
}

module.exports = { extractStudyMaterial };
