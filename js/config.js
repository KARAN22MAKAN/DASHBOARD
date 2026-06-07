/**
 * config.js — Central configuration for the Desk Dashboard.
 *
 * This is the ONLY file you need to edit for routine maintenance.
 * Never hardcode values in other files — always add them here first.
 *
 * To add a new widget:
 *   1. Create js/widgets/yourwidget.js
 *   2. Add a <script src="js/widgets/yourwidget.js"> to index.html
 *   3. That's it — the widget registers itself.
 */

const CONFIG = {

  // ── Weather ─────────────────────────────────────────────────────
  // Get a free API key at https://openweathermap.org/api
  // Replace the string below with your key when you reach Sprint 3.
  weather: {
    apiKey:    '34481b672608ef0561182897c4b9a8aa',
    refreshMs: 30 * 60 * 1000,                  // refresh every 30 minutes
    fallback:  { lat: 19.0760, lon: 72.8777 },  // Mumbai — used if geolocation is denied
  },

  // ── Ambient Mode ────────────────────────────────────────────────
  ambient: {
    timeoutMs: 10 * 1000,  // seconds of inactivity before returning to ambient clock
  },

  // ── Clock ───────────────────────────────────────────────────────
  clock: {
    default24h: false,  // false = 12-hour (AM/PM), true = 24-hour
  },

};
