/**
 * weather.js — Weather and AQI widget.
 *
 * Flow:
 *   1. Request device location via Geolocation API
 *   2. If denied or unavailable → use CONFIG.weather.fallback (Mumbai)
 *   3. Fetch /weather and /air_pollution from OpenWeatherMap in parallel
 *   4. Render temperature, condition, AQI badge, location, freshness
 *   5. Save successful data to localStorage
 *   6. On any error → show last cached data with a stale indicator
 *   7. Repeat every CONFIG.weather.refreshMs (30 minutes)
 *
 * SETUP: Replace 'YOUR_OPENWEATHERMAP_KEY_HERE' in config.js with your
 * free API key from https://openweathermap.org/api
 */

const WeatherWidget = {

  CACHE_KEY: 'dash_weather_cache',
  _coords:   null,
  _timer:    null,

  /**
   * OpenWeatherMap AQI scale: 1 (best) → 5 (worst).
   * Maps to a label and a CSS colour variable.
   */
  AQI: [
    { label: 'Good',      cssVar: 'var(--aqi-good)'     },  // index 1
    { label: 'Fair',      cssVar: 'var(--aqi-good)'     },  // index 2
    { label: 'Moderate',  cssVar: 'var(--aqi-moderate)' },  // index 3
    { label: 'Poor',      cssVar: 'var(--aqi-poor)'     },  // index 4
    { label: 'Very Poor', cssVar: 'var(--aqi-poor)'     },  // index 5
  ],

  /** Initialise — request location then start rendering. */
  init() {
    this._requestLocation();
  },

  /** Ask the browser for the device location. */
  _requestLocation() {
    if (!('geolocation' in navigator)) {
      this._useFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this._coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        this.render();
        this._scheduleRefresh();
      },
      (_err) => {
        // Denied or timed out — silently use the config fallback
        this._useFallback();
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  },

  /** Use the Mumbai fallback coordinates from config. */
  _useFallback() {
    this._coords = { ...CONFIG.weather.fallback };
    this.render();
    this._scheduleRefresh();
  },

  /** Fetch fresh data and update the widget. Called on init and every 30 min. */
  async render() {
    const container = document.getElementById('widget-weather');
    if (!container) return;

    // Guard: show a helpful message until the API key is added
    if (CONFIG.weather.apiKey === 'YOUR_OPENWEATHERMAP_KEY_HERE') {
      container.innerHTML = this._errorHTML(
        'Add your OpenWeatherMap API key to js/config.js to see weather'
      );
      return;
    }

    try {
      const { lat, lon } = this._coords;
      const key  = CONFIG.weather.apiKey;
      const base = 'https://api.openweathermap.org/data/2.5';

      // Both requests run in parallel — faster than sequential
      const [weatherResp, airResp] = await Promise.all([
        fetch(`${base}/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`),
        fetch(`${base}/air_pollution?lat=${lat}&lon=${lon}&appid=${key}`),
      ]);

      if (!weatherResp.ok) throw new Error(`Weather API: ${weatherResp.status}`);
      if (!airResp.ok)     throw new Error(`AQI API: ${airResp.status}`);

      const weatherData = await weatherResp.json();
      const airData     = await airResp.json();

      // Build a clean data object
      const data = {
        temp:      Math.round(weatherData.main.temp),
        feelsLike: Math.round(weatherData.main.feels_like),
        condition: this._titleCase(weatherData.weather[0].description),
        city:      weatherData.name || 'Unknown',
        aqi:       airData.list[0].main.aqi,
        updatedAt: Date.now(),
      };

      // Save to cache before rendering (so even a render error leaves good data)
      this._saveCache(data);

      // Add a subtle refresh animation
      container.classList.add('widget-refreshing');
      setTimeout(() => container.classList.remove('widget-refreshing'), 700);

      this._renderData(container, data, false);

    } catch (err) {
      // Network error, API error, etc. — try the cache
      const cached = this._loadCache();
      if (cached) {
        this._renderData(container, cached, true);
      } else {
        container.innerHTML = this._errorHTML('Weather unavailable — check connection');
      }
    }
  },

  /**
   * Build and inject the weather card HTML.
   * @param {HTMLElement} el       — the widget container
   * @param {Object}      data     — weather data object
   * @param {boolean}     isStale  — true when showing cached data
   */
  _renderData(el, data, isStale) {
    const aqiInfo  = this.AQI[(data.aqi ?? 3) - 1] || this.AQI[2];
    const dotClass = isStale ? 'weather-dot is-stale stale-pulse' : 'weather-dot';
    const timeAgo  = isStale ? this._timeAgo(data.updatedAt) : 'Just now';

    el.innerHTML = `
      <div class="weather-temp">
        ${data.temp}<span class="weather-unit">°C</span>
      </div>

      <div class="weather-condition">${data.condition}</div>

      <div class="weather-aqi"
           style="color:${aqiInfo.cssVar};
                  border-color:${aqiInfo.cssVar};
                  background:${aqiInfo.cssVar}12;">
        <span class="weather-aqi-value">AQI ${data.aqi}</span>
        <span class="weather-aqi-label"> · ${aqiInfo.label}</span>
      </div>

      <div class="weather-meta">
        <span class="${dotClass}"></span>
        <span>${data.city} · ${timeAgo}</span>
        ${isStale ? '<span class="stale-badge">stale</span>' : ''}
      </div>
    `;
  },

  /** Render a friendly error/empty state. */
  _errorHTML(message) {
    return `<div class="weather-error">${message}</div>`;
  },

  /** Convert a string to Title Case ("partly cloudy" → "Partly Cloudy"). */
  _titleCase(str) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
  },

  /**
   * Convert a past timestamp to a human-readable relative string.
   * e.g. "2 min ago", "1h ago"
   */
  _timeAgo(timestamp) {
    const mins = Math.round((Date.now() - timestamp) / 60_000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    return `${Math.round(mins / 60)}h ago`;
  },

  /** Persist data to localStorage. Silently fails if storage is full. */
  _saveCache(data) {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
    } catch (_) {}
  },

  /** Load cached data. Returns null if nothing is stored or JSON is invalid. */
  _loadCache() {
    try {
      const raw = localStorage.getItem(this.CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  },

  /** Schedule the next automatic refresh. */
  _scheduleRefresh() {
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => this.render(), CONFIG.weather.refreshMs);
  },

};
