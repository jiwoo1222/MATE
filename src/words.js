export const MAX_WORDS = 60;

export function parseBulkInput(text) {
  const words = [];
  const invalidLines = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;
    let en, ko, related = '';
    if (line.includes('|')) {
      const columns = line.split('|').map((part) => part.trim());
      if (columns.length > 3) {
        invalidLines.push(index + 1);
        return;
      }
      [en = '', ko = '', related = ''] = columns;
    } else {
      const comma = line.indexOf(',');
      en = comma < 0 ? '' : line.slice(0, comma).trim();
      ko = comma < 0 ? '' : line.slice(comma + 1).trim();
    }
    if (!en || !ko) invalidLines.push(index + 1);
    else words.push({ en, ko, related });
  });
  return { words, invalidLines };
}

export function validateWords(words) {
  if (!words.length) return '단어를 1개 이상 입력해주세요.';
  if (words.length > MAX_WORDS) return `단어는 최대 ${MAX_WORDS}개까지 저장할 수 있어요. 초과한 단어를 나누어 입력해주세요.`;
  const seen = new Set();
  for (const [index, word] of words.entries()) {
    if (!word.en.trim() || !word.ko.split(',').some((meaning) => meaning.trim())) return `${index + 1}번째 단어의 영어와 뜻을 모두 입력해주세요.`;
    const key = word.en.trim().replace(/\s+/g, ' ').toLowerCase();
    if (seen.has(key)) return `중복된 영어 단어가 있어요: ${word.en.trim()}`;
    seen.add(key);
  }
  return '';
}
