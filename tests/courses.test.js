// Run with: node --test tests/*.test.js
// Checks the lesson data and the exercise builder, so a typo in a lesson cannot reach the app.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const api = new Function(`
  let course = 'en'; const isZh = () => course === 'zh';
  ${['util.js', 'judge.js', 'lesson.js', 'courses-en.js', 'courses-zh.js', 'courses.js'].map(read).join('\n')}
  return { COURSES, allLessons, setCourse: c => { course = c; }, buildLesson, sentTiles, judgeSpeech, sentText, enTokens, zhChars, enNumberWords };
`)();
const { COURSES, allLessons, setCourse, buildLesson, sentTiles, judgeSpeech, sentText } = api;

const ORIGINAL_ORDER = { en: ['en1', 'en2', 'en3', 'en4', 'en5', 'en6'], zh: ['zh1', 'zh2', 'zh3', 'zh4', 'zh5', 'zh6'] };
const MIN_LESSONS = { en: 24, zh: 22 };
const PINYIN = /^[\p{L}' ]+$/u; // letters with tone marks, apostrophes and spaces

for (const code of ['en', 'zh']) {
  const course = COURSES[code];
  const lessons = allLessons(code);

  test(`${code}: is a real course, not a sampler`, () => {
    assert.ok(lessons.length >= MIN_LESSONS[code], `only ${lessons.length} lessons`);
    assert.ok(course.units.length >= 6, `only ${course.units.length} units`);
    course.units.forEach(u => { assert.ok(u.title && u.desc && u.level, `unit ${u.title} needs title, desc and level`); assert.ok(u.lessons.length >= 3, `${u.title} is too short`); });
  });

  test(`${code}: progress saved before the rewrite still unlocks the same lessons`, () => {
    assert.deepStrictEqual(lessons.slice(0, 6).map(l => l.id), ORIGINAL_ORDER[code]);
    assert.strictEqual(new Set(lessons.map(l => l.id)).size, lessons.length, 'duplicate lesson id');
  });

  test(`${code}: every lesson has a note, enough words and enough sentences`, () => {
    lessons.forEach(l => {
      assert.ok(l.title, l.id);
      assert.ok(l.note && l.note.length >= 40, `${l.id}: needs a study note`);
      assert.ok(l.words.length >= 8, `${l.id}: only ${l.words.length} words`);
      assert.ok(l.sentences.length >= (code === 'en' ? 8 : 7), `${l.id}: only ${l.sentences.length} sentences`);
    });
  });

  test(`${code}: words and sentences are unique inside a lesson, and every meaning differs`, () => {
    lessons.forEach(l => {
      const targets = l.words.map(w => w[0]), meanings = l.words.map(w => w[1]);
      assert.strictEqual(new Set(targets).size, targets.length, `${l.id}: repeated word`);
      assert.strictEqual(new Set(meanings).size, meanings.length, `${l.id}: two words share a meaning, the multiple-choice options would clash`);
      const sents = l.sentences.map(sentText);
      assert.strictEqual(new Set(sents).size, sents.length, `${l.id}: repeated sentence`);
      l.words.forEach(w => assert.ok(w[0] && w[1], `${l.id}: empty word`));
      l.sentences.forEach(s => assert.ok(s.id && s.id.length > 3, `${l.id}: ${sentText(s)} has no translation`));
    });
  });

  test(`${code}: every sentence is judged correct when read back exactly`, () => {
    setCourse(code);
    lessons.forEach(l => l.sentences.forEach(s => {
      assert.strictEqual(judgeSpeech(s, [sentText(s)]).score, 1, `${l.id}: ${sentText(s)}`);
      (s.alt || []).forEach(a => assert.strictEqual(judgeSpeech(s, [a]).score, 1, `${l.id}: alt ${a}`));
    }));
  });

  test(`${code}: sentences fit the tile bank (3 to 11 tiles)`, () => {
    lessons.forEach(l => l.sentences.forEach(s => {
      const n = sentTiles(s).length;
      assert.ok(n >= 3 && n <= 11, `${l.id}: "${sentText(s)}" has ${n} tiles`);
    }));
  });

  test(`${code}: a lesson builds a full, solvable set of exercises`, () => {
    setCourse(code);
    lessons.forEach(l => {
      for (let run = 0; run < 5; run++) {
        const ex = buildLesson(l);
        assert.ok(ex.length >= 14, `${l.id}: only ${ex.length} exercises`);
        ex.forEach(e => {
          if (e.type === 'mc') { assert.strictEqual(new Set(e.opts).size, 4, `${l.id}: mc options`); assert.ok(e.opts.includes(e.word[1])); }
          if (e.type === 'mcrev') { assert.strictEqual(new Set(e.opts.map(o => o[0])).size, 4, `${l.id}: mcrev options`); assert.ok(e.opts.some(o => o[0] === e.word[0])); }
          if (e.type === 'build' || e.type === 'listen') {
            const have = e.bank.map(b => b.t);
            sentTiles(e.s).forEach(t => assert.ok(have.includes(t.t), `${l.id}: tile ${t.t} missing from the bank`));
          }
          if (e.type === 'cloze') {
            assert.strictEqual(e.opts.length, 4, `${l.id}: cloze needs 4 options, has ${e.opts.length} for "${sentText(e.s)}"`);
            assert.strictEqual(new Set(e.opts.map(o => o.t.toLowerCase())).size, 4, `${l.id}: cloze options repeat`);
            assert.ok(e.opts.some(o => o.t === e.answer.t));
          }
        });
      }
    });
  });
}

test('without a microphone the speaking exercises are dropped, the rest stays', () => {
  setCourse('en');
  const ex = buildLesson(allLessons('en')[0], { speak: false });
  assert.ok(ex.length >= 11);
  assert.ok(!ex.some(e => e.type === 'speak' || e.type === 'speaktr'));
});

test('Mandarin pinyin looks like pinyin and every Chinese token has one', () => {
  allLessons('zh').forEach(l => {
    l.words.forEach(w => assert.ok(w[2] && PINYIN.test(w[2]), `${l.id}: word ${w[0]} pinyin "${w[2]}"`));
    l.sentences.forEach(s => {
      assert.ok(s.tk && s.tk.length, `${l.id}: sentence must use tokens`);
      s.tk.forEach(([han, py]) => {
        if (/[一-鿿]/.test(han)) assert.ok(py && PINYIN.test(py) && py === py.trim(), `${l.id}: "${han}" has pinyin "${py}"`);
        else assert.strictEqual(py, '', `${l.id}: punctuation "${han}" must have empty pinyin`);
      });
    });
  });
});

test('English sentences only use letters, apostrophes and basic punctuation', () => {
  allLessons('en').forEach(l => l.sentences.forEach(s => assert.ok(/^[A-Za-z' ’,.?!-]+$/.test(s.t), `${l.id}: "${s.t}"`)));
});

test('numbers heard as digits match the spelled-out words', () => {
  assert.deepStrictEqual(api.enTokens('I am 25'), ['i', 'am', 'twenty', 'five']);
  assert.deepStrictEqual(api.enNumberWords(40), ['forty']);
  setCourse('zh');
  assert.deepStrictEqual(api.zhChars('我有2个'), ['我', '有', '二', '个']);
});
