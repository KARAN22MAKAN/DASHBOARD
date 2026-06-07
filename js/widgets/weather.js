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
 * iOS 12 FIXES:
 *   1. Replaced ?? nullish coalescing with explicit null check —
 *      ?? is not supported on iOS 12 Safari, causes syntax error.
 *   2. Replaced 60_000 numeric separator with 60000 —
 *      numeric separators not supported on iOS 12 Safari.
 */

const WeatherWidget = {

  CACHE_KEY: 'dash_weather_cache',
  _coords:   null,
  _timer:    null,

  AQI: [
    { label: 'Good',      cssVar: 'var(--aqi-good)'     },
    { label: 'Fair',      cssVar: 'var(--aqi-good)'     },
    { label: 'Moderate',  cssVar: 'var(--aqi-moderate)' },
    { label: 'Poor',      cssVar: 'var(--aqi-poor)'     },
    { label: 'Very Poor', cssVar: 'var(--aqi-poor)'     },
  ],

  init() {
    this._requestLocation();
  },

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
        this._useFallback();
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  },

  _useFallback() {
    this._coords = { lat: CONFIG.weather.fallback.lat, lon: CONFIG.weather.fallback.lon };
    this.render();
    this._scheduleRefresh();
  },

  async render() {
    const container = document.getElementById('widget-weather');
    if (!container) return;

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

      const [weatherResp, airResp] = await Promise.all([
        fetch(base + '/weather?lat=' + lat + '&lon=' + lon + '&appid=' + key + '&units=metric'),
        fetch(base + '/air_pollution?lat=' + lat + '&lon=' + lon + '&appid=' + key),
      ]);

      if (!weatherResp.ok) throw new Error('Weather API: ' + weatherResp.status);
      if (!airResp.ok)     throw new Error('AQI API: ' + airResp.status);

      const weatherData = await weatherResp.json();
      const airData     = await airResp.json();

      const data = {
        temp:      Math.round(weatherData.main.temp),
        feelsLike: Math.round(weatherData.main.feels_like),
        condition: this._titleCase(weatherData.weather[0].description),
        city:      weatherData.name || 'Unknown',
        aqi:       airData.list[0].main.aqi,
        updatedAt: Date.now(),
      };

      this._saveCache(data);

      container.classList.add('widget-refreshing');
      setTimeout(() => container.classList.remove('widget-refreshing'), 700);

      this._renderData(container, data, false);

    } catch (err) {
      const cached = this._loadCache();
      if (cached) {
        this._renderData(container, cached, true);
      } else {
        container.innerHTML = this._errorHTML('Weather unavailable — check connection');
      }
    }
  },

  _renderData(el, data, isStale) {
    // FIX 1: was (data.aqi ?? 3) — ?? nullish coalescing not supported on iOS 12.
    // Replaced with explicit null/undefined check.
    const aqiValue = (data.aqi !== null && data.aqi !== undefined) ? data.aqi : 3;
    const aqiInfo  = this.AQI[aqiValue - 1] || this.AQI[2];
    const dotClass = isStale ? 'weather-dot is-stale stale-pulse' : 'weather-dot';
    const timeAgo  = isStale ? this._timeAgo(data.updatedAt) : 'Just now';

    el.innerHTML = '<div class="weather-temp">'
      + data.temp + '<span class="weather-unit">\u00B0C</span>'
      + '</div>'
      + '<div class="weather-condition">' + data.condition + '</div>'
      + '<div class="weather-aqi"'
      + ' style="color:' + aqiInfo.cssVar + ';'
      + 'border-color:' + aqiInfo.cssVar + ';'
      + 'background:' + aqiInfo.cssVar.replace('var(', 'rgba(').replace(')', ', 0.07)') + ';">'
      + '<span class="weather-aqi-value">AQI ' + aqiValue + '</span>'
      + '<span class="weather-aqi-label"> \u00B7 ' + aqiInfo.label + '</span>'
      + '</div>'
      + '<div class="weather-meta">'
      + '<span class="' + dotClass + '"></span>'
      + '<span>' + data.city + ' \u00B7 ' + timeAgo + '</span>'
      + (isStale ? '<span class="stale-badge">stale</span>' : '')
      + '</div>';
  },

  _errorHTML(message) {
    return '<div class="weather-error">' + message + '</div>';
  },

  _titleCase(str) {
    return str.replace(/\b\w/g, function(c) { return c.toUpperCase(); });
  },

  _timeAgo(timestamp) {
    // FIX 2: was 60_000 — numeric separators not supported on iOS 12
    const mins = Math.round((Date.now() - timestamp) / 60000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return mins + ' min ago';
    return Math.round(mins / 60) + 'h ago';
  },

  _saveCache(data) {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
    } catch (_) {}
  },

  _loadCache() {
    try {
      const raw = localStorage.getItem(this.CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  },

  _scheduleRefresh() {
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => this.render(), CONFIG.weather.refreshMs);
  },

};
