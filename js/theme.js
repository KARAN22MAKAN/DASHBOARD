/**
 * theme.js — Dark / light theme manager.
 *
 * Reads saved preference from localStorage on page load.
 * Applies the theme immediately (before any content renders) to
 * prevent a flash of the wrong theme.
 * Wires up the theme toggle button.
 */

const ThemeManager = {

  KEY:     'dash_theme',
  DEFAULT: 'dark',

  /**
   * Call once on page load.
   * Reads saved theme, applies it, wires up toggle button.
   */
  init() {
    const saved = localStorage.getItem(this.KEY) || this.DEFAULT;
    this.apply(saved);

    document.getElementById('btn-theme')
      ?.addEventListener('click', () => this.toggle());
  },

  /**
   * Apply a theme by name ('dark' or 'light').
   * Sets the data-theme attribute, saves to localStorage,
   * updates the toggle icon and the PWA theme-color meta tag.
   */
  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.KEY, theme);

    // Update toggle icon
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = theme === 'dark' ? '☽' : '☀';

    // Keep PWA status bar colour in sync
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0A0A0F' : '#F2F4F7');
  },

  /** Flip between dark and light. */
  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || this.DEFAULT;
    this.apply(current === 'dark' ? 'light' : 'dark');
  },

  /** Return the currently active theme name. */
  current() {
    return document.documentElement.getAttribute('data-theme') || this.DEFAULT;
  },

};
