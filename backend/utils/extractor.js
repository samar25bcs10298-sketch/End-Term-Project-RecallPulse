/**
 * Robust Material Extractor for Flashcards & Quizzes
 * 
 * Handles:
 * 1. Bullet points with bullets (•, -, *, numbers)
 * 2. Formats: "• Term: Description" or "• Term (Extra): Description"
 * 3. Definition sentences: "Term is/refers to/describes..."
 * 4. Step-by-step processes: "1. Capacitation: Sperm undergo..."
 * 5. Generates high-yield active-recall questions (e.g. "What is the function of Fallopian Tubes?")
 */

function cleanTerm(term) {
  if (!term) return '';
  return term
    .replace(/^[\s•\-\*\d\.\)\(]+/, '') // strip leading bullets, numbers, dashes
    .replace(/[\(\[].*?[\)\]]/g, '')     // strip parenthetical info for cleaner question title
    .trim();
}

function extractStudyMaterial(rawText, deckTitle = 'Study Deck') {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Valid text content is required for generation');
  }

  const cleanText = rawText.trim();
  const rawLines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

  const flashcards = [];
  const mcqs = [];

  // Pattern A: Bullet / Line containing "Term: Definition" or "Term — Definition"
  // Example: "• Fallopian Tubes (Oviducts): Muscular tubes lined with ciliated epithelium..."
  // Example: "1. Capacitation: Sperm undergo biochemical changes..."
  const colonRegex = /^[\s•\-\*\d\.\)]*\s*([^:\n—–]{2,55})\s*[:—–]\s*(.+)$/;

  for (const line of rawLines) {
    const match = line.match(colonRegex);
    if (match) {
      const rawSubject = match[1].trim();
      const definition = match[2].trim();
      const subject = cleanTerm(rawSubject);

      // Filter out meta lines like "Phase: Days", "SPERMATOGENESIS: OOGENESIS", etc.
      if (
        subject.length >= 2 &&
        subject.length <= 50 &&
        definition.length >= 15 &&
        !subject.toLowerCase().startsWith('http') &&
        !['note', 'tip', 'phase', 'days', 'step'].includes(subject.toLowerCase())
      ) {
        // Natural question formulation
        let questionText = `What is ${subject}?`;
        if (definition.toLowerCase().startsWith('the biological process') || definition.toLowerCase().includes('process by which')) {
          questionText = `Define the process of ${subject}:`;
        } else if (definition.toLowerCase().includes('function') || definition.toLowerCase().includes('serves as') || definition.toLowerCase().includes('responsible for')) {
          questionText = `What is the primary function of ${subject}?`;
        } else if (definition.toLowerCase().includes('organ') || definition.toLowerCase().includes('muscular') || definition.toLowerCase().includes('structure')) {
          questionText = `Describe the structure and role of ${subject}:`;
        }

        flashcards.push({
          question: questionText,
          answer: definition,
          conceptTag: subject
        });
      }
    }
  }

  // Pattern B: Sentence-based extraction ("X is the biological process...", "X is a/an...")
  const sentences = cleanText
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 30 && s.length < 350);

  const linkingPhrases = [
    ' is the biological process by which ',
    ' is the process of ',
    ' is structured to ',
    ' is specialized to ',
    ' are tightly coiled structures where ',
    ' is a hollow, muscular organ where ',
    ' is a muscular canal serving as ',
    ' is a coiled tube where ',
    ' is a long muscular tube that ',
    ' refers to ',
    ' is defined as ',
    ' consists of '
  ];

  for (const sentence of sentences) {
    for (const phrase of linkingPhrases) {
      if (sentence.includes(phrase)) {
        const parts = sentence.split(phrase);
        if (parts.length === 2) {
          const rawSubject = parts[0].trim();
          const definition = parts[1].trim();
          const subject = cleanTerm(rawSubject);

          if (
            subject.length >= 3 &&
            subject.length <= 45 &&
            definition.length >= 20 &&
            !subject.toLowerCase().startsWith('it ') &&
            !subject.toLowerCase().startsWith('this ') &&
            !subject.toLowerCase().startsWith('these ')
          ) {
            flashcards.push({
              question: `Explain: ${subject}`,
              answer: `${subject} ${phrase.trim()} ${definition}`,
              conceptTag: subject
            });
          }
        }
      }
    }
  }

  // Deduplicate flashcards by concept / question
  const uniqueFlashcards = [];
  const seenConcepts = new Set();

  for (const f of flashcards) {
    const key = f.conceptTag.toLowerCase();
    if (!seenConcepts.has(key)) {
      seenConcepts.add(key);
      uniqueFlashcards.push(f);
    }
  }

  // Safety fallback if the text has no standard bullet or definition patterns
  if (uniqueFlashcards.length < 3) {
    // Look for paragraphs with meaningful content
    const paragraphs = cleanText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 50);
    paragraphs.forEach((p, idx) => {
      if (idx < 5) {
        const firstSentence = p.split('.')[0] + '.';
        const remaining = p.slice(firstSentence.length).trim() || p;
        uniqueFlashcards.push({
          question: `Core Principle (${idx + 1}): What is covered regarding "${firstSentence.slice(0, 40)}..."?`,
          answer: remaining,
          conceptTag: deckTitle
        });
      }
    });
  }

  // Generate Multiple Choice Questions from the extracted cards
  for (let i = 0; i < uniqueFlashcards.length && i < 12; i++) {
    const target = uniqueFlashcards[i];
    const correctAnswer = target.answer.length > 110 ? target.answer.slice(0, 105) + '...' : target.answer;
    
    // Pick distractors from other flashcard answers
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

    // High-quality contextual fallback distractors if card pool is small
    const fallbackDistractors = [
      'Inhibits hormonal feedback to signal termination of follicular maturation.',
      'Undergoes rapid mitosis without completing the necessary reduction division.',
      'Acts as a passive conduit without secretory or protective biochemical activity.',
      'Degenerates into non-viable polar bodies during early embryonic cleavage.'
    ];

    while (options.length < 4) {
      const fb = fallbackDistractors.pop();
      if (!options.includes(fb)) {
        options.push(fb);
      }
    }

    // Shuffle options
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
