/**
 * clock.js — Clock widget.
 *
 * Displays the current time in IST (UTC+5:30), updates every minute.
 * Handles the 12h/24h format toggle.
 * Has ZERO external dependencies — works fully offline, always.
 *
 * Updates BOTH the ambient screen and the active dashboard
 * from a single source of truth so they never drift apart.
 */

const ClockWidget = {

  /** IST = UTC + 5 hours 30 minutes, expressed in milliseconds */
  IST_OFFSET_MS: (5 * 60 + 30) * 60 * 1000,

  FORMAT_KEY: 'dash_clock_24h',
  _timer: null,

  /** Day names and month names used in date formatting */
  DAYS:   ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  MONTHS: ['January','February','March','April','May','June',
           'July','August','September','October','November','December'],

  /**
   * Initialise the widget.
   * Reads saved format preference, renders immediately, then schedules
   * updates to fire at the top of every minute for accuracy.
   */
  init() {
    // Restore saved format preference
    const saved = localStorage.getItem(this.FORMAT_KEY);
    if (saved !== null) CONFIG.clock.default24h = saved === 'true';

    // Wire up 12h/24h toggle button
    document.getElementById('btn-format')
      ?.addEventListener('click', () => this.toggleFormat());

    // Render immediately so clock shows on first frame
    this.render();
    this._updateFormatUI();

    // Then sync to the top of the next minute for precision
    this._scheduleNextTick();
  },

  /**
   * Wait until the top of the next minute, then tick every 60 seconds.
   * This is more accurate than a fixed 60s interval starting from page load.
   */
  _scheduleNextTick() {
    const now      = this._getIST();
    const msToNext = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    setTimeout(() => {
      this.render();
      this._timer = setInterval(() => this.render(), 60_000);
    }, msToNext);
  },

  /** Render current time into all clock elements on the page. */
  render() {
    const ist  = this._getIST();
    const data = this._format(ist);

    // ── Ambient screen ──────────────────────────────────────────
    this._setText('ambient-hours',   data.hours);
    this._setText('ambient-minutes', data.minutes);
    this._setText('ambient-ampm',    data.ampm);
    this._setText('ambient-date',    `${data.dayName}, ${data.dateStr}`);

    // ── Active dashboard ────────────────────────────────────────
    this._setText('active-time',  `${data.hours}:${data.minutes}`);
    this._setText('active-ampm',  data.ampm);
    this._setText('active-day',   data.dayName);
    this._setText('active-date',  data.dateStr);
  },

  /**
   * Return a Date object representing the current time in IST.
   * Calculated from UTC to avoid relying on the device timezone setting.
   */
  _getIST() {
    const now   = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
    return new Date(utcMs + this.IST_OFFSET_MS);
  },

  /**
   * Format a Date into display strings.
   * @param {Date} date — an IST Date object
   * @returns {{ hours, minutes, ampm, dayName, dateStr }}
   */
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
      hours    = String(rawHours); // no leading zero in 12h mode (e.g. "9", not "09")
    }

    const dayName = this.DAYS[date.getDay()];
    const dateStr = `${String(date.getDate()).padStart(2, '0')} `
                  + `${this.MONTHS[date.getMonth()]} `
                  + `${date.getFullYear()}`;

    return { hours, minutes, ampm, dayName, dateStr };
  },

  /** Toggle between 12h and 24h, persist, and re-render. */
  toggleFormat() {
    CONFIG.clock.default24h = !CONFIG.clock.default24h;
    localStorage.setItem(this.FORMAT_KEY, CONFIG.clock.default24h);
    this.render();
    this._updateFormatUI();
  },

  /** Sync the pill toggle UI and AM/PM visibility to current format. */
  _updateFormatUI() {
    const use24h = CONFIG.clock.default24h;

    document.getElementById('fmt-12')?.classList.toggle('fmt-active', !use24h);
    document.getElementById('fmt-24')?.classList.toggle('fmt-active',  use24h);

    // Hide AM/PM indicator completely in 24h mode
    ['active-ampm', 'ambient-ampm'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.visibility = use24h ? 'hidden' : 'visible';
    });
  },

  /** Helper: safely set textContent without throwing if element is missing. */
  _setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  },

};
