/**
 * ambient.js — Ambient / Active state machine.
 *
 * Manages the transition between:
 *   AMBIENT — fullscreen clock only, the default resting state
 *   ACTIVE  — full dashboard with all widgets visible
 *
 * Rules:
 *   - Page always starts in AMBIENT state
 *   - Any tap/click on the ambient screen → switch to ACTIVE
 *   - Any tap/click during ACTIVE → reset the inactivity timer
 *   - After CONFIG.ambient.timeoutMs of inactivity → return to AMBIENT
 */

const AmbientManager = {

  _state:  'ambient',   // current state: 'ambient' | 'active'
  _timer:  null,        // inactivity timeout handle
  _screen: null,        // #ambient-screen element
  _dash:   null,        // #dashboard element

  /**
   * Initialise. Call once after DOM is ready.
   * Finds elements, wires up listeners, starts in ambient state.
   */
  init() {
    this._screen = document.getElementById('ambient-screen');
    this._dash   = document.getElementById('dashboard');

    if (!this._screen || !this._dash) {
      console.warn('AmbientManager: could not find required elements.');
      return;
    }

    // Tap the ambient screen → go active
    this._screen.addEventListener('click', () => this.goActive());

    // Any tap during active mode → reset the inactivity timer
    document.addEventListener('click', (e) => {
      if (this._state === 'active') this._resetTimer();
    });

    // Touch events also count as activity (for iOS Safari)
    document.addEventListener('touchstart', () => {
      if (this._state === 'active') this._resetTimer();
    }, { passive: true });

    // Start in ambient
    this.goAmbient();
  },

  /** Switch to ambient mode. Hides dashboard, shows clock. */
  goAmbient() {
    this._state = 'ambient';
    this._clearTimer();
    this._screen.classList.remove('is-hidden');
    this._dash.classList.remove('is-active');
  },

  /** Switch to active mode. Shows dashboard, starts inactivity timer. */
  goActive() {
    this._state = 'active';
    this._screen.classList.add('is-hidden');
    this._dash.classList.add('is-active');
    this._resetTimer();
  },

  /** Reset the countdown back to the full timeout. */
  _resetTimer() {
    this._clearTimer();
    this._timer = setTimeout(
      () => this.goAmbient(),
      CONFIG.ambient.timeoutMs
    );
  },

  /** Clear any running countdown. */
  _clearTimer() {
    if (this._timer !== null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  },

  /** Return the current state string ('ambient' or 'active'). */
  state() {
    return this._state;
  },

};
