/**
 * theme.js — Dark / light theme manager.
 *
 * iOS 12 FIX: Removed ?. optional chaining (not supported on iOS 12 Safari).
 * This was causing a syntax error that prevented ThemeManager from being
 * defined, which crashed app.js on its first line and killed the entire app —
 * clock frozen, touch dead, nothing worked.
 */

const ThemeManager = {

  KEY:     'dash_theme',
  DEFAULT: 'dark',

  init() {
    const saved = localStorage.getItem(this.KEY) || this.DEFAULT;
    this.apply(saved);

    // FIX: was document.getElementById('btn-theme')?.addEventListener(...)
    // ?. is NOT supported on iOS 12 — syntax error crashes entire script.
    const btnTheme = document.getElementById('btn-theme');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => this.toggle());
    }
  },

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.KEY, theme);

    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = theme === 'dark' ? '☽' : '☀';

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0A0A0F' : '#F2F4F7');
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || this.DEFAULT;
    this.apply(current === 'dark' ? 'light' : 'dark');
  },

  current() {
    return document.documentElement.getAttribute('data-theme') || this.DEFAULT;
  },

};
