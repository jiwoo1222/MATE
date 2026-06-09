import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exportBackup, parseBackup } from './backup.js';

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

const samplePack = {id:'a',name:'나의 팩',createdAt:1,words:[{id:'w',en:'apple',ko:'사과, 사과나무'}]};
function backup(entries) { return JSON.stringify({app:'MATE',version:1,entries}); }

test('backup parsing rebuilds meanings from validated word data', () => {
  const [entry] = parseBackup(backup([{key:'pack:a',value:samplePack}]));
  assert.deepEqual(entry.value.words[0].meanings,['사과','사과나무']);
});

test('backup validation rejects foreign keys, invalid nested words and duplicate entries', () => {
  for (const entries of [
    [{key:'other:token',value:'x'}],
    [{key:'pack:a',value:{...samplePack,words:[{id:'x',en:12,ko:'뜻'}]}}],
    [{key:'pack:b',value:samplePack}],
    [{key:'pack:a',value:samplePack},{key:'pack:a',value:samplePack}],
    [{key:'history:x',value:{id:'x',total:1,score:2}}],
  ]) assert.throws(()=>parseBackup(backup(entries)));
  assert.throws(()=>parseBackup('broken'));
  assert.throws(()=>parseBackup(JSON.stringify({app:'MATE',version:2,entries:[]})));
});
