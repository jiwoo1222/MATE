export function shuffle(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const normalize = (value) => String(value).trim().replace(/\s+/g, ' ').toLowerCase();
const meaningsOf = (word) => String(word.ko).split(',').map((s) => s.trim()).filter(Boolean);

export function buildQuiz(words, mode, fallbackWords = []) {
  const english = mode.startsWith('en-');
  return shuffle(words).map((word) => {
    const meanings = meaningsOf(word);
    const ownMeanings = new Set(meanings.map(normalize));
    const answer = english ? word.en : shuffle(meanings)[0];
    const seen = new Set([normalize(answer)]);
    const distractors = [];
    for (const candidate of [...shuffle(words), ...shuffle(fallbackWords)]) {
      const candidateMeanings = meaningsOf(candidate);
      if (normalize(candidate.en) === normalize(word.en)) continue;
      if (candidateMeanings.some((meaning) => ownMeanings.has(normalize(meaning)))) continue;
      const value = english ? candidate.en : shuffle(candidateMeanings)[0];
      if (!value || seen.has(normalize(value))) continue;
      seen.add(normalize(value));
      distractors.push(value);
      if (distractors.length === 3) break;
    }
    return { ...word, meanings, questionAnswer: answer, questionOptions: shuffle([answer, ...distractors]) };
  });
}
