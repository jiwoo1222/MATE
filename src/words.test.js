import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBulkInput, validateWords } from './words.js';

test('bulk import preserves multiple meanings and optional related words', () => {
  assert.deepEqual(parseBulkInput('apple, 사과, 사과나무\r\n\nattach | 붙이다, 부착하다 | 반의어: detach').words, [
    { en: 'apple', ko: '사과, 사과나무', related: '' },
    { en: 'attach', ko: '붙이다, 부착하다', related: '반의어: detach' },
  ]);
});
test('invalid lines retain their original line numbers', () => {
  assert.deepEqual(parseBulkInput('\nmissing\napple,사과\nword | ').invalidLines, [2, 4]);
});
test('overflow is reported without silently dropping imported words', () => {
  const { words } = parseBulkInput(Array.from({ length: 61 }, (_, i) => `word${i},뜻`).join('\n'));
  assert.equal(words.length, 61);
  assert.match(validateWords(words), /최대 60개/);
});
test('blank and duplicate rows are blocked before saving', () => {
  assert.match(validateWords([{ en: 'apple', ko: '' }]), /영어와 뜻/);
  assert.match(validateWords([{ en: 'Apple', ko: '사과' }, { en: ' apple ', ko: '사과' }]), /중복/);
});

test('comma-only meanings cannot create an unanswerable quiz question', () => {
  assert.match(validateWords([{ en: 'apple', ko: ' , , ' }]), /영어와 뜻/);
  assert.equal(validateWords([{ en: 'apple', ko: ', 사과, ' }]), '');
});

test('extra pipe-separated columns are reported instead of silently discarded', () => {
  const result = parseBulkInput('apple | 사과 | 과일 | 누락될 내용\nbook | 책');
  assert.deepEqual(result.invalidLines, [1]);
  assert.deepEqual(result.words, [{ en: 'book', ko: '책', related: '' }]);
});
