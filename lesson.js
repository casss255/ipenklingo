/* Builds the list of exercises for one lesson. Pure: no DOM, no global state except helpers from util.js. */
const SLOTS = ['mc', 'mc', 'match', 'cloze', 'build', 'mcrev', 'listen', 'cloze', 'build', 'speak', 'mc', 'listen', 'speaktr', 'mcrev', 'speak'];
const SPEAK_TYPES = ['speak', 'speaktr'];

function sentTiles(s) {
  if (s.tk) return s.tk.filter(t => /[一-鿿]/.test(t[0])).map(t => ({ t: t[0], p: t[1] }));
  return s.t.replace(/[.,!?]/g, '').split(/\s+/).map(t => ({ t }));
}
/* Tiles from the same lesson that can serve as wrong answers */
function tilePool(s, lesson) {
  const own = new Set(sentTiles(s).map(t => t.t.toLowerCase()));
  const all = s.tk
    ? lesson.sentences.flatMap(sentTiles).concat(lesson.words.map(w => ({ t: w[0], p: w[2] })))
    : lesson.words.filter(w => !w[0].includes(' ')).map(w => ({ t: w[0] })).concat(lesson.sentences.flatMap(sentTiles));
  const seen = new Set();
  return shuffle(all).filter(t => { const k = t.t.toLowerCase(); if (own.has(k) || seen.has(k)) return false; seen.add(k); return true; });
}
function bankFor(s, lesson) {
  const tiles = sentTiles(s);
  return shuffle(tiles.concat(tilePool(s, lesson).slice(0, 3))).map((t, i) => Object.assign({ i }, t));
}
/* Fill in the blank: hide one meaningful word, offer it among three other words from the lesson */
function clozeFor(s, lesson) {
  const tiles = sentTiles(s);
  const meaningful = tiles.map((t, i) => i).filter(i => s.tk || tiles[i].t.length >= 3);
  const idx = pick(meaningful.length ? meaningful : tiles.map((t, i) => i), 1)[0];
  const answer = tiles[idx];
  const wrong = tilePool(s, lesson).filter(t => s.tk || t.t.length >= 3).slice(0, 3);
  return { s, tiles, idx, answer, opts: shuffle([answer].concat(wrong)) };
}

function buildLesson(lesson, { speak = true } = {}) {
  const W = shuffle(lesson.words), SS = shuffle(lesson.sentences);
  let wi = 0, si = 0;
  const word = () => W[wi++ % W.length];
  const sent = () => SS[si++ % SS.length];
  const ex = SLOTS.map(type => {
    if (type === 'mc') { const w = word(); return { type, word: w, opts: shuffle([w[1]].concat(pick(lesson.words.filter(x => x !== w).map(x => x[1]), 3))) }; }
    if (type === 'mcrev') { const w = word(); return { type, word: w, opts: shuffle([w].concat(pick(lesson.words.filter(x => x !== w), 3))) }; }
    if (type === 'match') return { type, pairs: pick(lesson.words, Math.min(5, lesson.words.length)) };
    if (type === 'cloze') return Object.assign({ type }, clozeFor(sent(), lesson));
    const s = sent();
    return type === 'build' || type === 'listen' ? { type, s, bank: bankFor(s, lesson) } : { type, s };
  });
  return ex.filter(e => speak || !SPEAK_TYPES.includes(e.type));
}
