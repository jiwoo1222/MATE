import { useRef, useState } from 'react';
import { exportBackup, parseBackup, restoreBackup } from './backup.js';

export default function BackupPanel({ onRestored }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const buttonClass = 'rounded-xl border border-[#2E6FBE] px-4 py-2.5 text-sm font-semibold text-[#2E6FBE] disabled:opacity-50';

  async function perform(action) {
    if (busy) return;
    setBusy(true);
    setMessage('');
    setError('');
    try { await action(); }
    catch (failure) { setError(failure.message || '백업을 처리하지 못했어요.'); }
    finally { setBusy(false); }
  }

  function download() {
    return perform(() => {
      const content = exportBackup();
      const url = URL.createObjectURL(new Blob([content], { type: 'application/json;charset=utf-8' }));
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mate-backup.json';
        document.body.append(link);
        link.click();
        link.remove();
        setMessage('학습 데이터 백업 파일을 내려받았습니다.');
      } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
    });
  }

  function selectFile(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    setPending(null);
    void perform(async () => {
      if (file.size > 5000000) throw new Error('5MB 이하의 MATE 백업 파일을 선택해주세요.');
      const text = await file.text();
      const entries = parseBackup(text);
      setPending({ text, count: entries.length, name: file.name });
    });
  }

  return (
    <section aria-label="학습 데이터 백업" aria-busy={busy} className="mx-5 mb-6 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold text-[#1E2A3A]">학습 데이터 백업</h2>
      <p className="mt-2 mb-3 text-sm text-[#64748B]">단어팩·오답·학습 기록을 파일로 보관하고 다른 브라우저로 옮겨요.</p>
      <div className="flex flex-wrap gap-2">
        <button className={buttonClass} disabled={busy} onClick={download}>백업 내보내기</button>
        <button className={buttonClass} disabled={busy} onClick={() => input.current.click()}>백업 가져오기</button>
      </div>
      <input ref={input} type="file" accept=".json,application/json" aria-label="MATE 백업 파일" hidden onChange={selectFile} />
      {pending && (
        <div className="mt-3 rounded-xl bg-[#EAF3FB] p-3 text-sm text-[#1E2A3A]">
          <p className="break-all">{pending.name} · {pending.count}개 항목을 확인했습니다.</p>
          <p className="my-2">같은 ID의 기존 데이터는 유지하고 없는 항목만 추가합니다. ID가 다른 단어팩은 별도 팩으로 추가됩니다.</p>
          <div className="flex flex-wrap gap-2">
            <button className={buttonClass} disabled={busy} onClick={() => perform(async () => {
              const result = restoreBackup(pending.text);
              setPending(null);
              setMessage(`${result.added}개 항목을 추가했습니다. 기존 ${result.skipped}개 항목은 유지했습니다.`);
              await onRestored();
            })}>확인 후 복원</button>
            <button className={buttonClass} disabled={busy} onClick={() => setPending(null)}>취소</button>
          </div>
        </div>
      )}
      {message && <p role="status" className="mt-3 text-sm text-[#2E6FBE]">{message}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </section>
  );
}
