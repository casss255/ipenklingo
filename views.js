/* Screens. Every function returns an HTML string. Reads S, C(), nav and L from the other scripts. */
const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
const unitOf = id => C().units.find(u => u.lessons.some(l => l.id === id));
const pinyinOf = s => s.tk.map(t => t[1]).filter(Boolean).join(' ');
const wordsKnown = c => allLessons(c).filter(l => S.done[l.id]).reduce((n, l) => n + l.words.length, 0);

/* ---------- Shared pieces ---------- */
function appbar() {
  return `<header class="appbar"><div class="brand">${LOGO}Ipenk Lingo</div>
    <button class="chip" data-act="tab" data-tab="profile" aria-label="Ganti bahasa">${I.globe}${esc(C().code)}</button></header>`;
}
function speakBtn(text, label) { return `<button class="icon-btn" data-act="say" data-t="${esc(text)}" aria-label="Dengarkan ${esc(label || text)}">${I.spk}</button>`; }
function wordRow(w) {
  const py = isZh() && w[2] ? `<span class="py">${esc(w[2])}</span>` : '';
  return `<div class="vrow"><div><span class="w">${esc(w[0])}</span>${py}<div class="mn">${esc(w[1])}</div></div>${speakBtn(w[0])}</div>`;
}
function sentRow(s) {
  const py = s.tk ? `<div class="mn">${esc(pinyinOf(s))}</div>` : '';
  return `<div class="vrow"><div><span class="w">${esc(sentText(s))}</span>${py}<div class="mn">${esc(s.id)}</div></div>${speakBtn(sentText(s))}</div>`;
}

/* ---------- Welcome ---------- */
function viewWelcome() {
  return `<div class="welcome"><div class="brand">${LOGO}Ipenk Lingo</div>
    <div><h1>Belajar bahasa dengan kurikulum yang terarah</h1>
      <p style="margin-top:10px">Pelajaran bertahap dari dasar sampai percakapan kerja, lengkap dengan suara contoh dan latihan berbicara.</p></div>
    <div class="choice">${Object.keys(COURSES).map(k => {
      const n = courseCounts(k);
      return `<button data-act="pick-course" data-c="${k}"><span class="code">${esc(COURSES[k].code)}</span><span><b>${esc(COURSES[k].name)}</b><small>${n.lessons} pelajaran · ${n.words} kata · ${n.sentences} kalimat</small></span></button>`;
    }).join('')}</div></div>`;
}

/* ---------- Learn tab ---------- */
function statsStrip() {
  const st = streakNow();
  return `<div class="card stats">
    <div class="stat ${st ? 'on' : ''}"><b>${I.flame}${st}</b><small>Hari beruntun</small></div>
    <div class="stat"><b>${I.bolt}${S.xp}</b><small>Total XP</small></div>
    <div class="stat"><b>${I.heart}${S.hearts}/${MAX_HEARTS}</b><small>Hati</small></div></div>`;
}
function heroCard() {
  const ls = allLessons(S.course), idx = lessonIndex(S.course), done = ls.filter(l => S.done[l.id]).length, p = pct(done, ls.length);
  const prog = `<div class="progress-row"><div class="bar"><i style="width:${p}%"></i></div><span>${done} dari ${ls.length} pelajaran · ${p}%</span></div>`;
  if (idx === -1) return `<section class="card hero"><span class="eyebrow">Kursus selesai</span><h2>Semua pelajaran sudah kamu selesaikan</h2><p class="meta">Ulangi pelajaran mana saja untuk latihan dan tambahan XP.</p>${prog}</section>`;
  const l = ls[idx], u = unitOf(l.id);
  return `<section class="card hero"><span class="eyebrow">${done ? 'Lanjutkan belajar' : 'Mulai belajar'}</span>
    <h2>${esc(l.title)}</h2><p class="meta">${esc(u.title)} · ${esc(u.desc)} · ${l.words.length} kata · ${l.sentences.length} kalimat</p>
    ${prog}<button class="btn" data-act="open" data-id="${l.id}">${done ? 'Lanjutkan' : 'Mulai'}</button></section>`;
}
function goalCard() {
  const tx = todayXp();
  return `<div class="card goal">${I.target}<div class="bar"><i style="width:${Math.min(100, pct(tx, GOAL))}%"></i></div><b>${Math.min(tx, GOAL)}/${GOAL} XP hari ini</b></div>`;
}
function lessonRow(l, i, first) {
  const done = !!S.done[l.id], current = i === first, locked = !done && !current;
  const state = done ? 'done' : current ? 'current' : 'locked';
  const end = done ? (S.best[l.id] ? `${S.best[l.id]}%` : 'Selesai') : current ? 'Mulai' : '';
  return `<button class="row ${state}" data-act="${locked ? 'locked' : 'open'}" data-id="${l.id}">
    <span class="num">${done ? I.check : locked ? I.lock : i + 1}</span>
    <span><span class="t">${esc(l.title)}</span><span class="m">${l.words.length} kata · ${l.sentences.length} kalimat</span></span>
    <span class="end">${end}${locked ? '' : I.chev}</span></button>`;
}
function unitsList() {
  const first = lessonIndex(S.course);
  let idx = 0;
  return `<div class="units">${C().units.map(u => {
    const rows = u.lessons.map(l => lessonRow(l, idx++, first)).join('');
    const doneN = u.lessons.filter(l => S.done[l.id]).length;
    return `<section><div class="unit-head"><h2><small>${esc(u.title)} · ${esc(u.level)}</small>${esc(u.desc)}</h2><span class="count">${doneN}/${u.lessons.length}</span></div><div class="card lessons">${rows}</div></section>`;
  }).join('')}</div>`;
}
const viewLearn = () => appbar() + statsStrip() + heroCard() + goalCard() + unitsList();

/* ---------- Lesson overview ---------- */
function viewPreview() {
  const l = allLessons(S.course).find(x => x.id === nav.pv), u = unitOf(l.id), practice = !!S.done[l.id];
  return `<div class="subbar"><button class="icon-btn" data-act="back-preview" aria-label="Kembali">${I.back}</button><span>${esc(u.title)} · ${esc(u.desc)}</span></div>
    <h1 class="ov-title">${esc(l.title)}</h1>
    <p class="muted">${l.words.length} kata · ${l.sentences.length} kalimat${practice ? ' · sudah selesai' : ''}</p>
    <div class="note-card"><span class="eyebrow">Catatan</span><p>${esc(l.note)}</p></div>
    <h2 class="section-title">Kosakata</h2><div class="card vocab">${l.words.map(wordRow).join('')}</div>
    <h2 class="section-title">Contoh kalimat</h2><div class="card vocab">${l.sentences.map(sentRow).join('')}</div>
    <div class="sticky-cta"><button class="btn" data-act="begin" data-id="${l.id}">${practice ? 'Latihan lagi' : 'Mulai latihan'}</button></div>`;
}

/* ---------- Vocabulary tab ---------- */
function vocabList() {
  const q = (nav.q || '').trim().toLowerCase();
  const learned = allLessons(S.course).filter(l => S.done[l.id]);
  if (!learned.length) return '<div class="card empty">Belum ada kosakata. Selesaikan pelajaran pertama, lalu kata-katanya muncul di sini.</div>';
  const groups = learned.map(l => ({ l, words: l.words.filter(w => !q || w.some(x => String(x).toLowerCase().includes(q))) })).filter(g => g.words.length);
  if (!groups.length) return '<div class="card empty">Tidak ada kata yang cocok.</div>';
  return groups.map(g => `<div class="group-title">${esc(g.l.title)}</div><div class="card vocab">${g.words.map(wordRow).join('')}</div>`).join('');
}
function viewVocab() {
  return `${appbar()}<h1 class="page-title">Kosakata</h1>
    <p class="page-sub">${wordsKnown(S.course)} kata dari pelajaran yang sudah selesai</p>
    <input class="search" type="search" data-q value="${esc(nav.q || '')}" placeholder="Cari kata atau arti" aria-label="Cari kata" autocomplete="off">
    <div id="vocab-list">${vocabList()}</div>`;
}

/* ---------- Profile ---------- */
function viewProfile() {
  const ls = allLessons(S.course), done = ls.filter(l => S.done[l.id]).length, tx = todayXp();
  const seg = (act, cur, items) => `<div class="seg">${items.map(([k, n]) => `<button data-act="${act}" data-v="${k}" aria-pressed="${cur === k}">${n}</button>`).join('')}</div>`;
  return `${appbar()}<h1 class="page-title">Profil</h1>
    <div class="grid2" style="margin-top:14px">
      <div class="card metric"><small>Hari beruntun</small><b>${streakNow()}</b></div>
      <div class="card metric"><small>Total XP</small><b>${S.xp}</b></div>
      <div class="card metric"><small>Pelajaran ${esc(C().short)}</small><b>${done}/${ls.length}</b></div>
      <div class="card metric"><small>Kata dipelajari</small><b>${wordsKnown(S.course)}</b></div></div>
    <div class="card goal" style="margin-top:10px">${I.target}<div class="bar"><i style="width:${Math.min(100, pct(tx, GOAL))}%"></i></div><b>${Math.min(tx, GOAL)}/${GOAL} XP hari ini</b></div>
    <p class="page-sub" style="margin:8px 2px 0">Hati: ${S.hearts}/${MAX_HEARTS}${S.hearts < MAX_HEARTS ? ' (terisi 1 setiap 30 menit)' : ''}</p>

    <h2 class="section-title">Bahasa yang dipelajari</h2>
    <div class="choice">${Object.keys(COURSES).map(k => `<button data-act="pick-course" data-c="${k}" aria-pressed="${S.course === k}"><span class="code">${esc(COURSES[k].code)}</span><span><b>${esc(COURSES[k].name)}</b><small>${allLessons(k).filter(l => S.done[l.id]).length} dari ${allLessons(k).length} pelajaran selesai</small></span></button>`).join('')}</div>

    <h2 class="section-title">Tampilan</h2>${seg('theme', S.theme, [['auto', 'Otomatis'], ['light', 'Terang'], ['dark', 'Gelap']])}
    <h2 class="section-title">Kecepatan suara</h2>${seg('rate', S.rate, [[0.8, 'Pelan'], [1, 'Normal'], [1.15, 'Cepat']])}
    <h2 class="section-title">Mikrofon</h2>
    <p class="muted" style="font-size:14px">${canListen ? 'Latihan bicara aktif. Kalau mikrofon tidak merespons di app Home Screen, buka lewat Safari.' : 'Browser ini belum mendukung pengenalan suara. Latihan bicara dilewati otomatis. Coba buka di Safari (iPhone) atau Chrome.'}</p>
    ${S.speakOffUntil > Date.now() ? '<button class="btn plain small" style="margin-top:12px" data-act="speak-on">Aktifkan lagi latihan bicara</button>' : ''}
    <button class="danger-link" data-act="reset">Hapus progres ${esc(C().short)}</button>`;
}

/* ---------- Lesson ---------- */
function wordPrompt(w) {
  const long = w[0].length > 14 ? ' long' : '';
  return `<div class="card prompt"><div>${isZh() && w[2] ? `<div class="py">${esc(w[2])}</div>` : ''}<div class="big${long}">${esc(w[0])}</div></div>
    <button class="spk" data-act="say" data-t="${esc(w[0])}" aria-label="Dengarkan">${I.spk}</button></div>`;
}
function sentenceView(s) {
  if (!s.tk) return `<span>${esc(s.t)}</span>`;
  return `<span class="say-target">${s.tk.map(([h, p]) => `<span class="w"><small>${esc(p) || '&nbsp;'}</small>${esc(h)}</span>`).join('')}</span>`;
}
function coloredSentence(s, r) {
  return `<span class="say-target">${displayUnits(s, r.ans, r.ok).map(u => `<span class="w ${u.good ? 'good' : 'miss'}">${u.py !== undefined ? `<small>${esc(u.py) || '&nbsp;'}</small>` : isZh() ? '<small>&nbsp;</small>' : ''}${esc(u.text)}</span>`).join('')}</span>`;
}
const tileHtml = (t, cls, act, i) => `<button class="tile ${cls}" data-act="${act}" data-i="${i}">${t.p !== undefined && isZh() ? `<small>${esc(t.p)}</small>` : ''}${esc(t.t)}</button>`;
const optionHtml = (label, value, k, withPinyin) => `<button class="opt" data-act="sel" data-v="${esc(value)}" aria-pressed="${L.sel === value}"><span class="k">${k + 1}</span><span>${withPinyin ? `<small>${esc(withPinyin)}</small>` : ''}${esc(label)}</span></button>`;

/* The sentence with one word hidden; once answered, the blank shows the right word */
function clozeLine(e) {
  const filled = L.state !== 'answer';
  const blank = filled ? `<span class="w"><small>&nbsp;</small><span class="blank filled">${esc(e.answer.t)}</span></span>` : '<span class="w"><small>&nbsp;</small><span class="blank"></span></span>';
  if (!e.s.tk) { // words keep their commas and full stops; the blank keeps the punctuation that followed the hidden word
    return e.s.t.split(/\s+/).map((w, i) => {
      if (i !== e.idx) return `<span class="w"><small>&nbsp;</small>${esc(w)}</span>`;
      const tail = (w.match(/[.,!?]+$/) || [''])[0];
      return blank + (tail ? `<span class="w tail"><small>&nbsp;</small>${tail}</span>` : '');
    }).join('');
  }
  let hanzi = -1;
  return e.s.tk.map(([h, p]) => {
    if (!/[一-鿿]/.test(h)) return `<span class="w"><small>&nbsp;</small>${esc(h)}</span>`;
    hanzi++;
    return hanzi === e.idx ? blank : `<span class="w"><small>${esc(p)}</small>${esc(h)}</span>`;
  }).join('');
}

function exerciseBody(e) {
  const C1 = C();
  if (e.type === 'mc') return `<span class="eyebrow">Arti kata</span><h2>Apa arti kata ini?</h2>${wordPrompt(e.word)}
    <div class="options">${e.opts.map((o, k) => optionHtml(o, o, k)).join('')}</div>`;
  if (e.type === 'mcrev') return `<span class="eyebrow">Terjemahkan</span><h2>Bagaimana mengatakan "${esc(e.word[1])}"?</h2>
    <div class="options">${e.opts.map((o, k) => optionHtml(o[0], o[0], k, isZh() ? o[2] : '')).join('')}</div>`;
  if (e.type === 'match') {
    if (!e.left) { e.left = shuffle(e.pairs); e.right = shuffle(e.pairs); }
    const m = L.matched, s = L.sel || {};
    const side = (list, sd, label) => list.map(w => `<button class="pair ${m.includes(w[0]) ? 'matched' : ''} ${s.wrong === sd + w[0] ? 'wrong' : ''}" data-act="pair" data-side="${sd}" data-k="${esc(w[0])}" aria-pressed="${s[sd] === w[0]}">${label(w)}</button>`).join('');
    return `<span class="eyebrow">Pasangkan</span><h2>Pasangkan kata dengan artinya</h2><div class="pairs">
      <div class="col">${side(e.left, 'L', w => (isZh() ? `<small>${esc(w[2])}</small>` : '') + esc(w[0]))}</div>
      <div class="col">${side(e.right, 'R', w => esc(w[1]))}</div></div>`;
  }
  if (e.type === 'cloze') return `<span class="eyebrow">Lengkapi kalimat</span><h2>Pilih kata yang hilang</h2>
    <div class="card prompt text"><div class="cloze">${clozeLine(e)}</div></div><p class="hint">${esc(e.s.id)}</p>
    <div class="options">${e.opts.map((o, k) => optionHtml(o.t, o.t, k, isZh() ? o.p : '')).join('')}</div>`;
  if (e.type === 'build' || e.type === 'listen') {
    const head = e.type === 'build'
      ? `<span class="eyebrow">Susun kalimat</span><h2>Terjemahkan ke ${esc(C1.speakName)}</h2><div class="card prompt text">${esc(e.s.id)}</div>`
      : `<span class="eyebrow">Menyimak</span><h2>Susun kalimat yang kamu dengar</h2><div class="listen-row"><button class="spk big" data-act="say" data-t="${esc(sentText(e.s))}" aria-label="Putar suara">${I.spk}</button><button class="slow" data-act="say-slow" data-t="${esc(sentText(e.s))}" aria-label="Putar pelan">Pelan</button></div>`;
    return `${head}<div class="answer-line">${L.picked.map(i => tileHtml(e.bank[i], '', 'unpick', i)).join('')}</div>
      <div class="bank">${e.bank.map(t => tileHtml(t, L.picked.includes(t.i) ? 'used' : '', 'pick', t.i)).join('')}</div>`;
  }
  return speakBody(e, C1);
}
function speakBody(e, C1) {
  const r = L.result;
  const target = e.type === 'speak'
    ? `<span class="eyebrow">Berbicara</span><h2>Ucapkan kalimat ini</h2><div class="card prompt text"><div>${r ? coloredSentence(e.s, r) : sentenceView(e.s)}</div><button class="spk" data-act="say" data-t="${esc(sentText(e.s))}" aria-label="Dengarkan contoh">${I.spk}</button></div>`
    : `<span class="eyebrow">Berbicara</span><h2>Ucapkan dalam ${esc(C1.speakName)}</h2><div class="card prompt text">${esc(e.s.id)}</div>`;
  const status = { listening: 'Mendengarkan... bicara sekarang', denied: 'Izin mikrofon ditolak. Aktifkan di pengaturan browser, lalu coba lagi.', silent: 'Suara tidak terdengar. Tekan dan coba lagi.', error: 'Mikrofon bermasalah. Coba lagi atau lewati.' }[L.micState] || '';
  return `${target}<div class="mic-area">
    <button class="mic ${L.micState === 'listening' ? 'listening' : ''}" data-act="mic">${I.mic}${L.micState === 'listening' ? 'Mendengarkan...' : r ? 'Coba ucapkan lagi' : 'Tekan untuk bicara'}</button>
    ${status ? `<p class="note">${status}</p>` : ''}
    ${r ? `<div class="heard">Terdengar: <b>${esc(r.heard)}</b></div>` : ''}
    <button class="skip-link" data-act="skip-speak">Tidak bisa bicara sekarang</button></div>`;
}
function viewLesson() {
  const e = cur(), p = pct(L.answered, L.answered + L.queue.length - L.i);
  return `<div class="lesson-top"><button class="icon-btn" data-act="quit" aria-label="Keluar">${I.x}</button>
      <div class="bar"><i style="width:${p}%"></i></div><span class="lives">${I.heart}${L.practice ? '∞' : S.hearts}</span></div>
    <div class="ex">${exerciseBody(e)}</div>${checkbar(e)}`;
}
function canCheck(e) {
  if (e.type === 'mc' || e.type === 'mcrev' || e.type === 'cloze') return !!L.sel;
  if (e.type === 'build' || e.type === 'listen') return L.picked.length > 0;
  if (e.type === 'speak' || e.type === 'speaktr') return !!L.result;
  return false;
}
const PRAISE = ['Benar', 'Tepat', 'Bagus', 'Sempurna'];
function checkbar(e) {
  if (L.state === 'answer') {
    if (e.type === 'match') return '';
    return `<div class="checkbar"><button class="btn" data-act="check" ${canCheck(e) ? '' : 'disabled'}>Periksa</button></div>`;
  }
  const ok = L.state === 'right', fb = L.feedback || {}, isSpeak = e.type === 'speak' || e.type === 'speaktr';
  return `<div class="checkbar ${ok ? 'ok' : 'bad'}" role="status">
    <div class="fb"><span class="badge">${ok ? I.check : I.x}</span>
      <div><h3>${ok ? (fb.title || PRAISE[Math.floor(Math.random() * PRAISE.length)]) : (fb.title || 'Jawaban yang benar')}</h3>${fb.html ? `<p>${fb.html}</p>` : ''}</div></div>
    ${!ok && isSpeak ? `<div class="row2"><button class="btn plain" data-act="retry-speak">Coba lagi</button><button class="btn bad" data-act="next">Lanjut</button></div>`
      : `<button class="btn ${ok ? 'ok' : 'bad'}" data-act="next">Lanjut</button>`}
  </div>`;
}
function viewResult() {
  const secs = Math.round((Date.now() - L.start) / 1000);
  return `<div class="result"><div class="big-check">${I.check}</div>
    <h1>${L.mistakes === 0 ? 'Tanpa kesalahan' : 'Pelajaran selesai'}</h1>
    <p class="note">${esc(L.lesson.title)}${L.gotHeart ? ' · +1 hati' : ''}</p>
    <div class="card tiles">
      <div><b>+${L.xp}</b><small>XP</small></div><div><b>${L.acc}%</b><small>Akurasi</small></div>
      <div><b>${Math.floor(secs / 60)}:${pad(secs % 60)}</b><small>Waktu</small></div><div><b>${streakNow()}</b><small>Hari beruntun</small></div></div>
    ${L.missed.length ? `<div class="review"><h2 class="section-title">Perlu diulang</h2><div class="card vocab">${L.missed.map(wordRow).join('')}</div></div>` : ''}</div>
    <div class="checkbar"><button class="btn" data-act="done">Lanjut</button></div>`;
}
