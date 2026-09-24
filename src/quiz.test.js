import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildQuiz } from './quiz.js';

const words = [
  { en: 'apple', ko: '사과, 사과나무' },
  { en: 'Apple', ko: '사과' },
  { en: 'fruit', ko: '과일' },
  { en: 'tree', ko: '나무' },
  { en: 'book', ko: '책' },
];
test('choice questions contain one correct answer and distinct distractors', () => {
  for (const mode of ['en-choice', 'ko-choice']) {
    const questions = buildQuiz(words, mode);
    const apple = questions.find((w) => w.en === 'apple');
    assert.equal(apple.questionOptions.length, 4);
    assert.equal(new Set(apple.questionOptions.map((s) => s.toLowerCase())).size, 4);
    assert.equal(apple.questionOptions.filter((s) => s === apple.questionAnswer).length, 1);
    if (mode === 'ko-choice') assert.ok(!apple.questionOptions.includes('사과나무') || apple.questionAnswer === '사과나무');
  }
});
test('a single-word pack uses fallback vocabulary for meaningful choices', () => {
  const [question] = buildQuiz([words[0]], 'en-choice', words.slice(2));
  assert.equal(question.questionOptions.length, 4);
});
test('quiz preparation does not change saved pack data', () => {
  const before = structuredClone(words);
  buildQuiz(words, 'ko-choice');
  assert.deepEqual(words, before);
});
