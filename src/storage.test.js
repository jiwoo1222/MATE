import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getJSON, setJSON, deleteKey, seedPacks } from './storage.js';

beforeEach(() => {
  const data = new Map();
  globalThis.localStorage = {
    get length() { return data.size; },
    key: (i) => [...data.keys()][i],
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
});

test('deleted default packs stay deleted after subsequent loads', async () => {
  const defaults = [{ key: 'day6' }];
  const build = (pack) => ({ id: 'first', sourceKey: pack.key });
  await seedPacks(defaults, build);
  await deleteKey('pack:first');
  await seedPacks(defaults, build);
  assert.equal(await getJSON('pack:first'), null);
});

test('existing packs migrate without creating duplicates', async () => {
  await setJSON('pack:old', { id: 'old', sourceKey: 'day6' });
  await seedPacks([{ key: 'day6' }], () => { throw new Error('duplicate'); });
  assert.deepEqual(await getJSON('meta:seededDefaultPacks'), ['day6']);
});

test('write failures reject instead of reporting success', async () => {
  localStorage.setItem = () => { throw new Error('quota'); };
  await assert.rejects(setJSON('pack:a', {}), /저장하지 못했어요/);
});

test('corrupt JSON is reported without removing the original value', async () => {
  localStorage.setItem('pack:a', '{broken');
  await assert.rejects(getJSON('pack:a'), /읽지 못했어요/);
  assert.equal(localStorage.getItem('pack:a'), '{broken');
});
