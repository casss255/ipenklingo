/* Text to speech (the example voice) and speech recognition (speaking practice). Uses C() and S from app.js. */
let voices = [];
function loadVoices() { try { voices = speechSynthesis.getVoices(); } catch (e) {} }
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function voiceFor(lang) {
  const base = lang.slice(0, 2);
  return voices.find(v => v.lang === lang) || voices.find(v => v.lang.replace('_', '-').startsWith(lang)) || voices.find(v => v.lang.startsWith(base));
}
function say(text, slow) {
  if (!('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = C().lang; const v = voiceFor(C().lang); if (v) u.voice = v;
    u.rate = (slow ? 0.55 : 0.92) * S.rate;
    speechSynthesis.speak(u);
  } catch (e) {}
}

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const canListen = !!SR;
let rec = null;
function listen(onText, onState) {
  if (!SR) return;
  try { if (rec) rec.abort(); } catch (e) {}
  try { speechSynthesis.cancel(); } catch (e) {}
  rec = new SR();
  rec.lang = C().lang; rec.interimResults = false; rec.maxAlternatives = 5; rec.continuous = false;
  let got = false;
  rec.onstart = () => onState('listening');
  rec.onresult = e => { got = true; const r = e.results[0]; onText(Array.from(r).map(a => a.transcript)); };
  rec.onerror = e => { onState(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'denied' : e.error === 'no-speech' ? 'silent' : 'error'); };
  rec.onend = () => { if (!got) onState('idle'); };
  try { rec.start(); } catch (e) { onState('error'); }
}
function stopListen() { try { if (rec) rec.stop(); } catch (e) {} }

/* Short tones for right and wrong answers */
let actx = null;
function unlockAudio() { try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) {} }
function tone(f, t, d, type = 'sine', g0 = .14) {
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(.0001, actx.currentTime + t); g.gain.exponentialRampToValueAtTime(g0, actx.currentTime + t + .015);
  g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + t + d);
  o.connect(g).connect(actx.destination); o.start(actx.currentTime + t); o.stop(actx.currentTime + t + d + .02);
}
function sound(kind) {
  if (!actx) return;
  try {
    if (kind === true) { tone(660, 0, .12); tone(990, .1, .2); }
    else if (kind === 'win') { [523, 659, 784, 1046].forEach((f, i) => tone(f, i * .11, .25, 'triangle')); }
    else { tone(220, 0, .22, 'square', .06); }
  } catch (e) {}
}
