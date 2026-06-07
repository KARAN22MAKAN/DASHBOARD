/**
 * clock.js — Clock widget.
 *
 * Displays the current time in IST (UTC+5:30), updates every minute.
 * Handles the 12h/24h format toggle.
 * Has ZERO external dependencies — works fully offline, always.
 *
 * iOS 12 FIXES:
 *   1. Removed ?. optional chaining (×3) — not supported on iOS 12 Safari.
 *      Caused a syntax error killing the entire script.
 *   2. Replaced 60_000 numeric separator with 60000 — not supported on iOS 12.
 *   3. Replaced setInterval(60s) with 1-second tick — 60s interval drifted
 *      30-40 seconds over time due to callback overhead accumulation.
 *   4. Added visibilitychange listener — restarts clock when iOS resumes
 *      the PWA from background (prevents frozen/stale time display).
 */

const ClockWidget = {

  IST_OFFSET_MS: (5 * 60 + 30) * 60 * 1000,

  FORMAT_KEY: 'dash_clock_24h',
  _timer: null,

  DAYS:   ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  MONTHS: ['January','February','March','April','May','June',
           'July','August','September','October','November','December'],

  init() {
    const saved = localStorage.getItem(this.FORMAT_KEY);
    if (saved !== null) CONFIG.clock.default24h = saved === 'true';

    // FIX 1: was document.getElementById('btn-format')?.addEventListener(...)
    // ?. optional chaining NOT supported on iOS 12 — causes syntax error.
    const btnFormat = document.getElementById('btn-format');
    if (btnFormat) {
      btnFormat.addEventListener('click', () => this.toggleFormat());
    }

    this.render();
    this._updateFormatUI();
    this._startTick();

    // FIX 4: restart clock when iOS wakes the PWA from background
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.render();
        this._startTick();
      }
    });
  },

  /**
   * 1-second interval — re-renders only when the minute actually changes.
   * FIX 3: replaces the old setInterval(60_000) which drifted over time.
   */
  _startTick() {
    if (this._timer !== null) {
      clearInterval(this._timer);
      this._timer = null;
    }

    let lastMinute = -1;

    this._timer = setInterval(() => {
      const ist           = this._getIST();
      const currentMinute = ist.getHours() * 60 + ist.getMinutes();
      if (currentMinute !== lastMinute) {
        lastMinute = currentMinute;
        this.render();
      }
    }, 1000);
  },

  render() {
    const ist  = this._getIST();
    const data = this._format(ist);

    this._setText('ambient-hours',   data.hours);
    this._setText('ambient-minutes', data.minutes);
    this._setText('ambient-ampm',    data.ampm);
    this._setText('ambient-date',    data.dayName + ', ' + data.dateStr);

    this._setText('active-time',  data.hours + ':' + data.minutes);
    this._setText('active-ampm',  data.ampm);
    this._setText('active-day',   data.dayName);
    this._setText('active-date',  data.dateStr);
  },

  _getIST() {
    const now   = new Date();
    // FIX 2: was 60_000 — numeric separators not supported on iOS 12
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utcMs + this.IST_OFFSET_MS);
  },

  _format(date) {
    const use24h   = CONFIG.clock.default24h;
    let   rawHours = date.getHours();
    const minutes  = String(date.getMinutes()).padStart(2, '0');

    let hours, ampm;
    if (use24h) {
      hours = String(rawHours).padStart(2, '0');
      ampm  = '';
    } else {
      ampm     = rawHours < 12 ? 'AM' : 'PM';
      rawHours = rawHours % 12 || 12;
      hours    = String(rawHours);
    }

    const dayName = this.DAYS[date.getDay()];
    const dateStr = String(date.getDate()).padStart(2, '0') + ' '
                  + this.MONTHS[date.getMonth()] + ' '
                  + date.getFullYear();

    return { hours, minutes, ampm, dayName, dateStr };
  },

  toggleFormat() {
    CONFIG.clock.default24h = !CONFIG.clock.default24h;
    localStorage.setItem(this.FORMAT_KEY, CONFIG.clock.default24h);
    this.render();
    this._updateFormatUI();
  },

  _updateFormatUI() {
    const use24h = CONFIG.clock.default24h;

    // FIX 1: was document.getElementById('fmt-12')?.classList.toggle(...)
    // ?. NOT supported on iOS 12 — replaced with null checks.
    const fmt12 = document.getElementById('fmt-12');
    if (fmt12) fmt12.classList.toggle('fmt-active', !use24h);

    const fmt24 = document.getElementById('fmt-24');
    if (fmt24) fmt24.classList.toggle('fmt-active', use24h);

    ['active-ampm', 'ambient-ampm'].forEach(function(id) {
      const el = document.getElementById(id);
      if (el) el.style.visibility = use24h ? 'hidden' : 'visible';
    });
  },

  _setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  },

};
