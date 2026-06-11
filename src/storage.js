export async function listKeys(prefix) {
  try {
    return Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
      .filter((key) => key?.startsWith(prefix));
  } catch {
    throw new Error('학습 데이터 목록을 읽지 못했어요. 브라우저의 사이트 데이터 권한을 확인해주세요.');
  }
}

export async function getJSON(key) {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return null;
    return JSON.parse(value);
  } catch {
    throw new Error('저장된 학습 데이터를 읽지 못했어요. 사이트 데이터를 지우기 전에 백업을 확인해주세요.');
  }
}

export async function setJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error('저장하지 못했어요. 브라우저의 저장 공간과 사이트 데이터 권한을 확인해주세요.');
  }
}

export async function deleteKey(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    throw new Error('삭제하지 못했어요. 브라우저의 사이트 데이터 권한을 확인해주세요.');
  }
}

export async function seedPacks(defaults, buildPack) {
  const marker = 'meta:seededDefaultPacks';
  const seeded = new Set((await getJSON(marker)) || []);
  for (const key of await listKeys('pack:')) {
    const pack = await getJSON(key);
    if (pack?.sourceKey) seeded.add(pack.sourceKey);
  }
  for (const pack of defaults) {
    if (seeded.has(pack.key)) continue;
    const created = buildPack(pack);
    await setJSON('pack:' + created.id, created);
    seeded.add(pack.key);
  }
  await setJSON(marker, [...seeded]);
}
