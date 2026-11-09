/* Saved progress, theme, lives and streak. The storage key stays the same so existing progress carries over. */
const KEY = 'ipenk.v1';
const MAX_HEARTS = 5, HEART_MS = 30 * 60 * 1000, GOAL = 30;
const S = Object.assign({
  course: null, theme: 'auto', rate: 1,
  xp: 0, streak: 0, last: null, today: { date: null, xp: 0 },
  hearts: 5, heartAt: Date.now(), done: {}, best: {}, speakOffUntil: 0,
}, (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })());
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

function applyTheme() {
  if (S.theme === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', S.theme);
}
applyTheme();

const C = () => COURSES[S.course];
const isZh = () => S.course === 'zh';
const lessonIndex = c => allLessons(c).findIndex(l => !S.done[l.id]); // first unfinished lesson, -1 when all done

function refillHearts() {
  if (S.hearts >= MAX_HEARTS) { S.heartAt = Date.now(); return; }
  const n = Math.floor((Date.now() - S.heartAt) / HEART_MS);
  if (n > 0) { S.hearts = Math.min(MAX_HEARTS, S.hearts + n); S.heartAt += n * HEART_MS; if (S.hearts >= MAX_HEARTS) S.heartAt = Date.now(); save(); }
}
function streakNow() {
  if (!S.last) return 0;
  const y = new Date(); y.setDate(y.getDate() - 1);
  return (S.last === dayStr() || S.last === dayStr(y)) ? S.streak : 0;
}
function todayXp() { return S.today.date === dayStr() ? S.today.xp : 0; }
