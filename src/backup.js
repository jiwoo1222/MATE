const MARKER = 'meta:seededDefaultPacks';
const isLearningKey = key => key === MARKER || /^(pack|wrongnote|history):.+/.test(key);
const validId = value => typeof value === 'string' && value.length > 0;
const validTime = value => Number.isSafeInteger(value) && value >= 0 && value <= 8640000000000000;

function checkedWord(word) {
  if (!word || !validId(word.id) || typeof word.en !== 'string' || typeof word.ko !== 'string' || (word.related !== undefined && typeof word.related !== 'string')) throw new Error('단어의 ID와 영어·뜻 형식을 확인해주세요.');
  return { id: word.id, en: word.en.trim(), ko: word.ko.trim(), meanings: word.ko.split(',').map(value => value.trim()).filter(Boolean), ...(word.related ? {related:word.related} : {}) };
}

function checkedEntry({ key, value }) {
  if (typeof key !== 'string' || !isLearningKey(key)) throw new Error('허용되지 않는 백업 항목입니다.');
  if (key === MARKER) {
    if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) throw new Error('기본팩 추가 이력 형식을 확인해주세요.');
    return {key, value:[...new Set(value)]};
  }
  const id = key.slice(key.indexOf(':') + 1);
  if (key.startsWith('pack:')) {
    if (!value || value.id !== id || typeof value.name !== 'string' || !value.name.trim() || !validTime(value.createdAt) || !Array.isArray(value.words)) throw new Error('단어팩의 이름과 ID, 생성 시각을 확인해주세요.');
    const words = value.words.map(checkedWord);
    const error = validateWords(words);
    if (error) throw new Error(error);
    if (new Set(words.map(word => word.id)).size !== words.length) throw new Error('중복된 단어 ID입니다.');
    return {key, value:{id, name:value.name, createdAt:value.createdAt, words, ...(typeof value.sourceKey === 'string' ? {sourceKey:value.sourceKey} : {})}};
  }
  if (key.startsWith('wrongnote:')) {
    if (!Array.isArray(value)) throw new Error('오답 목록 형식을 확인해주세요.');
    const words = value.map(checkedWord);
    if (words.length && validateWords(words)) throw new Error('오답 단어 형식을 확인해주세요.');
    return {key, value:words};
  }
  const modes = ['en-choice', 'ko-choice', 'en-input', 'ko-input'];
  if (!value || value.id !== id || !validId(value.packId) || typeof value.label !== 'string' || !modes.includes(value.mode) || !validTime(value.ts) || !Number.isInteger(value.total) || value.total < 1 || value.total > 60 || !Number.isInteger(value.score) || value.score < 0 || value.score > value.total || !Number.isInteger(value.elapsed) || value.elapsed < 0) throw new Error('학습 기록 형식을 확인해주세요.');
  return {key, value:{id,packId:value.packId,label:value.label,mode:value.mode,total:value.total,score:value.score,wrongCount:value.total-value.score,elapsed:value.elapsed,ts:value.ts}};
}

export function parseBackup(text) {
  if (typeof text !== 'string' || text.length > 5000000) throw new Error('5MB 이하의 MATE 백업을 선택해주세요.');
  let file;
  try { file = JSON.parse(text); } catch { throw new Error('JSON 파일을 읽지 못했어요.'); }
  if (file?.app !== 'MATE' || file.version !== 1 || !Array.isArray(file.entries) || file.entries.length > 10000) throw new Error('지원하는 MATE 백업 파일이 아니에요.');
  const entries = file.entries.map(entry => {
    if (!entry || typeof entry !== 'object') throw new Error('백업 항목 형식을 확인해주세요.');
    return checkedEntry(entry);
  });
  if (new Set(entries.map(entry => entry.key)).size !== entries.length) throw new Error('중복된 백업 항목이 있어요.');
  return entries;
}

export function exportBackup(storage = globalThis.localStorage) {
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
    .filter(key => key && isLearningKey(key)).sort();
  const entries = keys.map(key => {
    const text = storage.getItem(key);
    try { return { key, value: JSON.parse(text) }; }
    catch { throw new Error(`백업할 데이터를 읽지 못했어요: ${key}`); }
  });
  return JSON.stringify({ app: 'MATE', version: 1, createdAt: Date.now(), entries }, null, 2);
}
import { validateWords } from './words.js';

