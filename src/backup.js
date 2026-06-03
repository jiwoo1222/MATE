const MARKER = 'meta:seededDefaultPacks';
const isLearningKey = key => key === MARKER || /^(pack|wrongnote|history):.+/.test(key);

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
