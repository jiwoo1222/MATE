import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exportBackup } from './backup.js';

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    get length() { return map.size; },
    key: index => [...map.keys()][index] ?? null,
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: key => map.delete(key),
  };
}

test('backup exports learning namespaces without unrelated website data', () => {
  const storage = memoryStorage({ 'pack:a': '{"id":"a"}', 'wrongnote:a': '[]', 'history:b': '{"id":"b"}', 'meta:seededDefaultPacks': '["day6"]', 'other-app:token': 'unrelated' });
  const backup = JSON.parse(exportBackup(storage));
  assert.equal(backup.app, 'MATE');
  assert.equal(backup.version, 1);
  assert.deepEqual(backup.entries.map(entry => entry.key), ['history:b', 'meta:seededDefaultPacks', 'pack:a', 'wrongnote:a']);
  assert.equal(storage.length, 5);
});

test('export reports corrupt JSON instead of silently omitting it', () => {
  assert.throws(() => exportBackup(memoryStorage({'pack:a':'broken'})), /pack:a/);
});
