/* Navigation, the running lesson, and all clicks. */
let nav = { tab: 'learn', pv: null, q: '' };
let L = null; // the lesson in progress

const TABS = [['learn', 'Belajar', I.path], ['vocab', 'Kosakata', I.vocab], ['profile', 'Profil', I.user]];
function render() {
  refillHearts();
  document.body.classList.toggle('in-lesson', !!L);
  document.body.classList.toggle('in-overview', !L && !!nav.pv);
  const v = $('#view');
  if (!S.course) v.innerHTML = viewWelcome();
  else if (L) v.innerHTML = L.finished ? viewResult() : viewLesson();
  else if (nav.pv) v.innerHTML = viewPreview();
  else v.innerHTML = nav.tab === 'profile' ? viewProfile() : nav.tab === 'vocab' ? viewVocab() : viewLearn();
  $('#tabs').hidden = !S.course || !!L || !!nav.pv;
  $('#tabs').innerHTML = `<div class="in">${TABS.map(([k, n, ic]) => `<button data-act="tab" data-tab="${k}" aria-current="${nav.tab === k ? 'page' : 'false'}">${ic}${n}</button>`).join('')}</div>`;
}
const goTo = (fn) => { fn(); render(); window.scrollTo(0, 0); };

/* ---------- Lesson flow ---------- */
const cur = () => L.queue[L.i];
function startLesson(id) {
  refillHearts();
  const lesson = allLessons(S.course).find(l => l.id === id);
  const practice = !!S.done[id];
  if (S.hearts <= 0 && !practice) { modalNoHearts(); return; }
  const speak = canListen && S.speakOffUntil <= Date.now();
  const queue = buildLesson(lesson, { speak });
  L = { lesson, practice, queue, i: 0, total: queue.length, mistakes: 0, answered: 0, missed: [], state: 'answer', sel: null, picked: [], matched: [], result: null, start: Date.now() };
  unlockAudio();
  render(); autoSpeak();
}
function autoSpeak() {
  const e = L && !L.finished && cur(); if (!e) return;
  setTimeout(() => {
    if (e.type === 'mc') say(e.word[0]);
    else if (e.type === 'listen') say(sentText(e.s));
  }, 350);
}
const pinyinLine = s => (s.tk ? `<br><span style="opacity:.8">${esc(pinyinOf(s))}</span>` : '');
function judgeAnswer(e) {
  if (e.type === 'mc') { say(e.word[0]); const ok = L.sel === e.word[1]; return { ok, fb: { html: `${esc(e.word[0])} = ${esc(e.word[1])}` } }; }
  if (e.type === 'mcrev') { say(e.word[0]); return { ok: L.sel === e.word[0], fb: { html: `${esc(e.word[0])}${isZh() ? ` (${esc(e.word[2])})` : ''}` } }; }
  if (e.type === 'cloze') { say(sentText(e.s)); return { ok: L.sel === e.answer.t, fb: { html: `${esc(sentText(e.s))}${pinyinLine(e.s)}<br><span style="opacity:.8">${esc(e.s.id)}</span>` } }; }
  if (e.type === 'build' || e.type === 'listen') {
    const a = tokensOf(L.picked.map(i => e.bank[i].t).join(isZh() ? '' : ' ')).join(' ');
    say(sentText(e.s));
    return { ok: sentAccepted(e.s).some(x => tokensOf(x).join(' ') === a), fb: { html: `${esc(sentText(e.s))}${pinyinLine(e.s)}${e.type === 'listen' ? `<br><span style="opacity:.8">${esc(e.s.id)}</span>` : ''}` } };
  }
  const r = L.result, ok = r.score >= (isZh() ? 0.75 : 0.8), score = Math.round(r.score * 100);
  const missed = displayUnits(e.s, r.ans, r.ok).filter(u => !u.good).map(u => u.text.replace(/[.,!?。，？！]/g, ''));
  const fb = ok
    ? { title: score >= 95 ? 'Pengucapan sempurna' : 'Bagus, sudah jelas', html: `Kecocokan ${score}%${missed.length ? `. Perhatikan: <b>${esc(missed.join(', '))}</b>` : ''}` }
    : { title: e.type === 'speaktr' ? 'Belum tepat' : 'Belum jelas', html: `Kecocokan ${score}%. ${missed.length ? `Bagian yang perlu diperbaiki: <b>${esc(missed.join(', '))}</b>. ` : ''}Contoh yang benar: ${esc(r.ans)}` };
  return { ok, fb };
}
function noteMissedWord(e) {
  const w = e.word || (e.answer && L.lesson.words.find(x => x[0] === e.answer.t));
  if (w && !L.missed.some(m => m[0] === w[0])) L.missed.push(w);
}
function check() {
  const e = cur(), { ok, fb } = judgeAnswer(e), isSpeak = e.type === 'speak' || e.type === 'speaktr';
  L.feedback = fb;
  L.state = ok ? 'right' : 'wrong';
  if (!ok && !isSpeak) {
    L.mistakes++;
    noteMissedWord(e);
    if (!L.practice) { if (S.hearts >= MAX_HEARTS) S.heartAt = Date.now(); S.hearts = Math.max(0, S.hearts - 1); save(); }
    L.queue.push(Object.assign({}, e, { left: null, right: null }));
  }
  sound(ok);
  render();
}
function next() {
  L.answered++;
  if (!L.practice && S.hearts <= 0) { L = null; render(); modalNoHearts(); return; }
  L.i++; L.state = 'answer'; L.sel = null; L.picked = []; L.matched = []; L.result = null; L.micState = null; L.feedback = null;
  if (L.i >= L.queue.length) finish();
  render(); window.scrollTo(0, 0); autoSpeak();
}
function finish() {
  L.acc = Math.max(0, Math.round((L.total - L.mistakes) / L.total * 100));
  L.xp = 15 + (L.mistakes === 0 ? 5 : 0);
  L.finished = true;
  S.xp += L.xp;
  const t = dayStr();
  if (S.today.date !== t) S.today = { date: t, xp: 0 };
  S.today.xp += L.xp;
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (S.last !== t) { S.streak = S.last === dayStr(y) ? S.streak + 1 : 1; S.last = t; }
  if (L.practice && S.hearts < MAX_HEARTS) { S.hearts++; L.gotHeart = true; }
  const id = L.lesson.id;
  S.done[id] = (S.done[id] || 0) + 1;
  S.best = Object.assign({}, S.best, { [id]: Math.max(S.best[id] || 0, L.acc) });
  save(); sound('win');
}

/* ---------- Modal & toast ---------- */
function modal(html) { const m = $('#modal'); m.innerHTML = `<div class="box">${html}</div>`; m.hidden = false; }
function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; }
function modalNoHearts() {
  refillHearts();
  const mins = Math.ceil((HEART_MS - (Date.now() - S.heartAt)) / 60000);
  modal(`<h3>Hati kamu habis</h3><p>1 hati terisi lagi dalam ${mins} menit. Sambil menunggu, ulangi pelajaran yang sudah selesai untuk mendapat 1 hati.</p><button class="btn" data-act="close-modal">Oke</button>`);
}
let toastT = 0;
function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2400); }

/* ---------- Clicks ---------- */
function pickPair(b) {
  const e = cur(), side = b.dataset.side, k = b.dataset.k;
  L.sel = Object.assign({}, L.sel, { wrong: null, [side]: k });
  if (side === 'L') say(k);
  if (L.sel.L && L.sel.R) {
    if (L.sel.L === L.sel.R) { L.matched.push(k); L.sel = null; sound(true); }
    else { L.sel = { wrong: side + k }; sound(false); }
  }
  render();
  if (L.matched.length === e.pairs.length) { L.state = 'right'; L.feedback = { title: 'Semua cocok' }; render(); }
}
function startMic() {
  if (L.micState === 'listening') { stopListen(); return; }
  const e = cur();
  listen(alts => { L.result = judgeSpeech(e.s, alts); L.micState = null; render(); },
    st => { L.micState = st === 'idle' ? (L.micState === 'listening' ? 'silent' : null) : st; if (L && !L.finished) render(); });
}
function skipSpeaking() {
  S.speakOffUntil = Date.now() + 15 * 60 * 1000; save(); stopListen();
  L.queue = L.queue.filter((e, i) => i <= L.i || (e.type !== 'speak' && e.type !== 'speaktr'));
  L.state = 'right'; L.feedback = { title: 'Latihan bicara dilewati', html: 'Latihan bicara dimatikan selama 15 menit.' };
  render();
}
const ACTIONS = {
  'tab': b => goTo(() => { nav.tab = b.dataset.tab; nav.pv = null; }),
  'pick-course': b => goTo(() => { S.course = b.dataset.c; save(); nav.tab = 'learn'; nav.pv = null; }),
  'theme': b => { S.theme = b.dataset.v; save(); applyTheme(); render(); },
  'rate': b => { S.rate = +b.dataset.v; save(); render(); say(isZh() ? '你好' : 'Hello'); },
  'speak-on': () => { S.speakOffUntil = 0; save(); render(); toast('Latihan bicara aktif lagi'); },
  'reset': () => {
    if (!confirm(`Hapus semua progres ${C().short}? XP dan hari beruntun tetap.`)) return;
    allLessons(S.course).forEach(l => { delete S.done[l.id]; delete S.best[l.id]; }); save(); render();
  },
  'locked': () => toast('Selesaikan pelajaran sebelumnya dulu'),
  'open': b => goTo(() => { nav.pv = b.dataset.id; }),
  'back-preview': () => goTo(() => { nav.pv = null; }),
  'begin': b => { nav.pv = null; startLesson(b.dataset.id); },
  'quit': () => {
    if (L.answered > 0 && !confirm('Keluar sekarang? Progres pelajaran ini akan hilang.')) return;
    stopListen(); L = null; render();
  },
  'say': b => say(b.dataset.t),
  'say-slow': b => say(b.dataset.t, true),
  'sel': b => { if (L.state !== 'answer') return; L.sel = b.dataset.v; render(); if (cur().type === 'mcrev') say(L.sel); },
  'pick': b => { if (L.state !== 'answer') return; L.picked.push(+b.dataset.i); if (isZh()) say(cur().bank[+b.dataset.i].t); render(); },
  'unpick': b => { if (L.state !== 'answer') return; L.picked = L.picked.filter(i => i !== +b.dataset.i); render(); },
  'pair': pickPair,
  'mic': startMic,
  'skip-speak': skipSpeaking,
  'retry-speak': () => { L.state = 'answer'; L.result = null; L.micState = null; L.feedback = null; render(); },
  'check': check,
  'next': next,
  'done': () => goTo(() => { L = null; }),
  'close-modal': closeModal,
};
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  unlockAudio();
  const run = ACTIONS[b.dataset.act];
  if (run) run(b);
});
document.addEventListener('input', ev => {
  if (!ev.target.matches('[data-q]')) return;
  nav.q = ev.target.value;
  $('#vocab-list').innerHTML = vocabList();
});
/* Keys 1-4 pick an answer, Enter checks or continues */
document.addEventListener('keydown', ev => {
  if (!L || L.finished) return;
  if (/^[1-4]$/.test(ev.key) && L.state === 'answer') { const o = document.querySelectorAll('.opt')[+ev.key - 1]; if (o) o.click(); }
  if (ev.key === 'Enter') { const btn = document.querySelector('[data-act="check"]:not([disabled]), .checkbar [data-act="next"]'); if (btn) btn.click(); }
});

render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
