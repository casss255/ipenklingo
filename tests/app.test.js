// Run with: node --test tests/*.test.js
// Loads the real app scripts against a tiny fake browser, renders every screen for both courses,
// and plays every exercise of every lesson with the correct answer.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const FILES = ['util', 'icons', 'courses-en', 'courses-zh', 'courses', 'judge', 'lesson', 'state', 'speech', 'views', 'app'];
function loadApp(saved) {
  const view = { innerHTML: '', hidden: false, value: '' }, store = saved ? { 'ipenk.v1': JSON.stringify(saved) } : {};
  const doc = { querySelector: () => view, querySelectorAll: () => [], addEventListener() {}, body: { classList: { toggle() {} } }, documentElement: { setAttribute() {}, removeAttribute() {} } };
  const ls = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; } };
  const src = FILES.map(f => fs.readFileSync(path.join(__dirname, '..', `${f}.js`), 'utf8')).join('\n');
  return new Function('document', 'window', 'navigator', 'localStorage', 'location', 'confirm', `${src}
    return { S, nav, allLessons, COURSES, buildLesson, startLesson, judgeAnswer, check, next, finish, render,
      viewWelcome, viewLearn, viewVocab, viewProfile, viewPreview, viewLesson, viewResult, vocabList, lessonIndex,
      setL: v => { L = v; }, getL: () => L, cur, judgeSpeech, sentText, sentTiles, streakNow };`)(
    doc, { scrollTo() {} }, {}, ls, { protocol: 'file:' }, () => true);
}
const escapeHtml = t => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const newLesson = (app, lesson, practice = false) => {
  const queue = app.buildLesson(lesson, { speak: true });
  const L = { lesson, practice, queue, i: 0, total: queue.length, mistakes: 0, answered: 0, missed: [], state: 'answer', sel: null, picked: [], matched: [], result: null, start: Date.now() };
  app.setL(L); return L;
};
/* Set the state a person would have after giving the right answer to the current exercise */
function answerCorrectly(app, L) {
  const e = L.queue[L.i];
  L.sel = null; L.picked = []; L.result = null;
  if (e.type === 'mc') L.sel = e.word[1];
  else if (e.type === 'mcrev') L.sel = e.word[0];
  else if (e.type === 'cloze') L.sel = e.answer.t;
  else if (e.type === 'build' || e.type === 'listen') { const used = new Set(); app.sentTiles(e.s).forEach(t => { const b = e.bank.find(x => x.t === t.t && !used.has(x.i)); used.add(b.i); L.picked.push(b.i); }); }
  else if (e.type === 'speak' || e.type === 'speaktr') L.result = app.judgeSpeech(e.s, [app.sentText(e.s)]);
  return e;
}

for (const code of ['en', 'zh']) {
  test(`${code}: every screen renders without errors`, () => {
    const app = loadApp({ course: code });
    assert.match(app.viewLearn(), /Mulai belajar/);
    assert.ok(app.viewProfile().includes('Profil'));
    assert.ok(app.viewVocab().includes('Belum ada kosakata'));
    const everything = {}; app.allLessons(code).forEach(l => { everything[l.id] = 1; });
    Object.assign(app.S.done, everything);
    assert.match(app.viewLearn(), /Kursus selesai/);
    assert.ok(app.vocabList().length > 1000);
    // lesson titles are HTML-escaped on screen ("&" becomes "&amp;", quotes become "&quot;")
    app.allLessons(code).forEach(l => { app.nav.pv = l.id; const html = app.viewPreview(); assert.ok(html.includes(escapeHtml(l.title)) && html.includes('Catatan'), l.id); });
  });

  test(`${code}: all exercises of all lessons are judged right with the right answer`, () => {
    const app = loadApp({ course: code });
    app.allLessons(code).forEach(lesson => {
      const L = newLesson(app, lesson);
      for (L.i = 0; L.i < L.queue.length; L.i++) {
        const e = answerCorrectly(app, L);
        L.state = 'answer';
        assert.ok(app.viewLesson().length > 100, `${lesson.id} ${e.type} view`);
        if (e.type === 'match') continue;
        assert.strictEqual(app.judgeAnswer(e).ok, true, `${lesson.id}: ${e.type} judged wrong`);
      }
    });
  });
}

test('a wrong multiple-choice answer costs a heart and lands the word in the review list', () => {
  const app = loadApp({ course: 'en' });
  const L = newLesson(app, app.allLessons('en')[0]);
  const i = L.queue.findIndex(e => e.type === 'mc');
  L.i = i;
  const e = L.queue[i];
  L.sel = e.opts.find(o => o !== e.word[1]);
  const before = app.S.hearts, size = L.queue.length;
  app.check();
  assert.strictEqual(L.state, 'wrong');
  assert.strictEqual(app.S.hearts, before - 1);
  assert.strictEqual(L.queue.length, size + 1, 'the exercise comes back at the end');
  assert.deepStrictEqual(L.missed.map(w => w[0]), [e.word[0]]);
  assert.match(app.viewLesson(), /Jawaban yang benar/);
});

test('finishing a lesson saves progress, XP, streak and the best accuracy', () => {
  const app = loadApp({ course: 'en' });
  const lesson = app.allLessons('en')[0], L = newLesson(app, lesson);
  L.mistakes = 3;
  app.finish();
  assert.strictEqual(app.S.done[lesson.id], 1);
  assert.strictEqual(app.S.xp, 15);
  assert.strictEqual(app.S.streak, 1);
  assert.strictEqual(app.S.best[lesson.id], Math.round((L.total - 3) / L.total * 100));
  const best = app.S.best[lesson.id];
  const again = newLesson(app, lesson, true); again.mistakes = 9; app.finish();
  assert.strictEqual(app.S.best[lesson.id], best, 'a worse retry must not lower the best score');
  assert.match(app.viewResult(), /Pelajaran selesai/);
});

test('progress saved by the older six-lesson version unlocks lesson seven next', () => {
  const app = loadApp({ course: 'en', done: { en1: 1, en2: 1, en3: 2, en4: 1, en5: 1, en6: 1 }, xp: 120, streak: 4 });
  assert.strictEqual(app.allLessons('en')[app.lessonIndex('en')].id, 'en7');
  assert.strictEqual(app.S.xp, 120);
  assert.ok(app.S.best && typeof app.S.best === 'object', 'old saves get an empty best-score table');
  assert.match(app.viewLearn(), /Lanjutkan belajar/);
});

test('vocabulary search matches both the word and its meaning', () => {
  const app = loadApp({ course: 'zh', done: { zh1: 1 } });
  app.nav.q = 'maaf';
  assert.ok(app.vocabList().includes('对不起') && !app.vocabList().includes('再见'));
  app.nav.q = 'zàijiàn';
  assert.ok(app.vocabList().includes('再见'));
  app.nav.q = 'tidak-ada-kata-ini';
  assert.ok(app.vocabList().includes('Tidak ada kata yang cocok'));
});

test('the interface contains no emoji', () => {
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  ['views.js', 'app.js', 'icons.js', 'index.html', 'style.css'].forEach(f => {
    const text = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    assert.ok(!emoji.test(text), `${f} contains an emoji`);
  });
});

test('the offline file list in sw.js covers every file the page loads', () => {
  const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  const html = read('index.html'), sw = read('sw.js');
  const loaded = [...html.matchAll(/(?:src|href)="\.\/([^"]+\.(?:js|css|webmanifest|png))"/g)].map(m => m[1]);
  assert.ok(loaded.length >= 14, 'found the page files');
  loaded.forEach(f => assert.ok(sw.includes(`'./${f}'`), `${f} is missing from SHELL in sw.js`));
  FILES.forEach(f => assert.ok(html.includes(`./${f}.js`), `${f}.js is not loaded by index.html`));
});
