/* Course catalogue: the units live in courses-en.js and courses-zh.js */
const COURSES = {
  en: { name: 'Bahasa Inggris', short: 'Inggris', code: 'EN', lang: 'en-US', speakName: 'bahasa Inggris', units: EN_UNITS },
  zh: { name: 'Bahasa Mandarin', short: 'Mandarin', code: '中文', lang: 'zh-CN', speakName: 'bahasa Mandarin', units: ZH_UNITS },
};
const allLessons = c => COURSES[c].units.flatMap(u => u.lessons);
const courseCounts = c => {
  const ls = allLessons(c);
  return { lessons: ls.length, words: ls.reduce((n, l) => n + l.words.length, 0), sentences: ls.reduce((n, l) => n + l.sentences.length, 0) };
};
