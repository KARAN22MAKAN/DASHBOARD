/**
 * app.js — Application bootstrap.
 *
 * This is the last script to load. It initialises everything in the
 * correct order and is the only file that knows about all widgets.
 *
 * To add a new widget:
 *   1. Create js/widgets/yourwidget.js
 *   2. Add <script src="js/widgets/yourwidget.js"> before this script in index.html
 *   3. Call YourWidget.init() below — that's all
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── 1. Theme ──────────────────────────────────────────────────
  // Applied first — prevents any flash of the wrong colour scheme.
  ThemeManager.init();

  // ── 2. Clock ──────────────────────────────────────────────────
  // No API needed. Starts immediately and works offline forever.
  ClockWidget.init();

  // ── 3. Ambient mode ───────────────────────────────────────────
  // Starts in ambient state. Listens for taps to reveal dashboard.
  AmbientManager.init();

  // ── 4. Weather widget ─────────────────────────────────────────
  // Requests location, fetches from OpenWeatherMap, shows AQI.
  // Silently shows a placeholder until CONFIG.weather.apiKey is set.
  WeatherWidget.init();

  // ── iOS: prevent rubber-band scroll ───────────────────────────
  // This dashboard is a fixed display — scrolling is never needed.
  document.addEventListener('touchmove', (e) => {
    e.preventDefault();
  }, { passive: false });

  // ── iOS: prevent double-tap zoom ──────────────────────────────
  let lastTap = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTap < 300) e.preventDefault();
    lastTap = now;
  }, { passive: false });

});
