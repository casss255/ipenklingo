/* Line icons (24px grid) and the logo. No emoji anywhere in the interface. */
const ico = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  x: ico('<path d="M6 6l12 12M18 6L6 18"/>'),
  back: ico('<path d="M15 5l-7 7 7 7"/>'),
  chev: ico('<path d="M9 5l7 7-7 7"/>'),
  check: ico('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  lock: ico('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>'),
  spk: ico('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
  mic: ico('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>'),
  flame: ico('<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.2 1 2 2 2 0-3-.5-5 1-8z"/>'),
  bolt: ico('<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>'),
  heart: ico('<path d="M12 20.5C6 16.5 3.5 13 3.5 9.5A4.5 4.5 0 0 1 12 7.2a4.5 4.5 0 0 1 8.500 2.300c0 3.500-2.500 7-8.500 11z"/>'),
  target: ico('<circle cx="12" cy="12" r="8.500"/><circle cx="12" cy="12" r="4.500"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
  path: ico('<path d="M4 6h16M4 12h16M4 18h10"/>'),
  vocab: ico('<path d="M5 4.500h9.500A3.500 3.500 0 0 1 18 8v12.500H8.500A3.500 3.500 0 0 1 5 17z"/><path d="M5 17a3.500 3.500 0 0 1 3.500-3.500H18"/>'),
  user: ico('<circle cx="12" cy="8.500" r="3.500"/><path d="M5 20c.8-3.600 3.500-5.500 7-5.500s6.200 1.900 7 5.500"/>'),
  globe: ico('<circle cx="12" cy="12" r="8.500"/><path d="M3.500 12h17M12 3.500c2.500 2.500 3.500 5.500 3.500 8.500s-1 6-3.500 8.500C9.500 18 8.500 15 8.500 12s1-6 3.500-8.500z"/>'),
};
const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="currentColor"/><path d="M12.500 8h7a3.500 3.500 0 0 1 3.500 3.500v5a3.500 3.500 0 0 1-3.500 3.500H16l-4.500 3.500V20A3.500 3.500 0 0 1 9 16.500v-5A3.500 3.500 0 0 1 12.500 8z" fill="#fff"/></svg>';
