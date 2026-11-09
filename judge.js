/* Text matching for typed/spoken answers. Uses isZh() from app.js. */
const EN_ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
/* 0-99 as English words, so "25" heard by the recognizer matches "twenty five" */
function enNumberWords(n) {
  if (n < 20) return [EN_ONES[n]];
  return n % 10 ? [EN_TENS[Math.floor(n / 10)], EN_ONES[n % 10]] : [EN_TENS[n / 10]];
}
const CONTR = {
  "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are', "he's": 'he is', "she's": 'she is', "it's": 'it is',
  "that's": 'that is', "what's": 'what is', "where's": 'where is', "who's": 'who is', "there's": 'there is', "here's": 'here is',
  "i'll": 'i will', "you'll": 'you will', "we'll": 'we will', "they'll": 'they will', "he'll": 'he will', "she'll": 'she will',
  "i've": 'i have', "you've": 'you have', "we've": 'we have', "they've": 'they have', "i'd": 'i would', "you'd": 'you would',
  "can't": 'can not', 'cannot': 'can not', "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "isn't": 'is not',
  "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not', "won't": 'will not', "haven't": 'have not', "hasn't": 'has not',
  "couldn't": 'could not', "wouldn't": 'would not', "shouldn't": 'should not', "o'clock": 'oclock', "let's": 'let us',
};
function normEnWord(w) {
  w = w.toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z0-9']/g, '');
  if (!w) return [];
  if (CONTR[w]) return CONTR[w].split(' ');
  if (/^\d+$/.test(w) && +w < 100) return enNumberWords(+w);
  return [w.replace(/'/g, '')];
}
function enTokens(s) { return s.replace(/(\d+):00/g, '$1 oclock').split(/[\s,.!?;:]+/).flatMap(normEnWord).filter(Boolean); }
const ZH_D = '零一二三四五六七八九';
function zhNum(n) { n = +n; if (n < 10) return ZH_D[n]; if (n < 20) return '十' + (n % 10 ? ZH_D[n % 10] : ''); if (n < 100) return ZH_D[Math.floor(n / 10)] + '十' + (n % 10 ? ZH_D[n % 10] : ''); return String(n); }
/* The recognizer may return 她/它 for 他 and 两 for 二; treat them as equal. */
function zhChars(s) {
  return s.replace(/\d+/g, m => zhNum(m)).replace(/两/g, '二').replace(/[她它]/g, '他')
    .replace(/[^一-鿿]/g, '').split('');
}
const tokensOf = s => isZh() ? zhChars(s) : enTokens(s);

/* LCS: how many target tokens were matched, and which ones */
function align(target, heard) {
  const n = target.length, m = heard.length, dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    dp[i][j] = target[i] === heard[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ok = new Array(n).fill(false); let i = 0, j = 0;
  while (i < n && j < m) { if (target[i] === heard[j]) { ok[i] = true; i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++; }
  const hit = dp[0][0];
  return { ok, score: n + m ? (2 * hit) / (n + m) : 0 };
}
function sentText(s) { return s.t || s.tk.map(x => x[0]).join(''); }
function sentAccepted(s) { return [sentText(s)].concat(s.alt || []); }

function judgeSpeech(sentence, alts) {
  let best = null;
  sentAccepted(sentence).forEach((ans, ai) => {
    const target = tokensOf(ans);
    alts.forEach(h => {
      const r = align(target, tokensOf(h));
      if (!best || r.score > best.score) best = Object.assign(r, { ans, ai, heard: h, target });
    });
  });
  return best;
}
/* Map normalized tokens back to the original words/characters, for coloring */
function displayUnits(sentence, ans, okFlags) {
  const units = [];
  if (isZh() && ans === sentText(sentence)) {
    sentence.tk.forEach(([h, p]) => { const ch = zhChars(h); if (ch.length) units.push({ text: h, py: p, n: ch.length }); });
  } else if (isZh()) {
    ans.split('').forEach(ch => { const n = zhChars(ch).length; if (n) units.push({ text: ch, n }); });
  } else {
    ans.split(/\s+/).forEach(w => { const n = enTokens(w).length; if (n) units.push({ text: w, n }); });
  }
  let k = 0;
  return units.map(u => { const good = okFlags.slice(k, k + u.n).every(Boolean); k += u.n; return Object.assign(u, { good }); });
}
