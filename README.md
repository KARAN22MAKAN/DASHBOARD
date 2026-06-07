# Desk Dashboard

A personal executive desk display for an iPhone permanently mounted on a desk. Shows a fullscreen ambient clock by default, with a full dashboard revealed on tap.

---

## What it does

- **Ambient mode** — fullscreen bold clock in San Francisco font, fills the screen. Tap to expand.
- **Active mode** — clock panel (left) + weather and AQI widget (right). Auto-returns to ambient after 10 seconds of inactivity.
- **Dark / light theme** — toggle in the top-right corner, persists across refreshes.
- **12h / 24h clock** — pill toggle at the bottom of the clock panel.
- **Weather + AQI** — auto-detects location, falls back to Mumbai. Refreshes every 30 minutes. Shows stale cached data if offline.

---

## Setup

### Step 1 — Fork or clone this repository

```bash
git clone https://github.com/YOUR_USERNAME/dashboard.git
cd dashboard
```

Or: click **Fork** on GitHub, then clone your fork.

### Step 2 — Get a free OpenWeatherMap API key

1. Go to https://openweathermap.org/api
2. Create a free account
3. Go to **API Keys** in your profile
4. Copy your default key (or create a new one)
5. **Restrict the key** to your domain: in OWM dashboard → API keys → edit → add `[yourname].github.io` as allowed referrer

### Step 3 — Add your API key

Open `js/config.js` and replace this line:

```js
apiKey: 'YOUR_OPENWEATHERMAP_KEY_HERE',
```

with your actual key:

```js
apiKey: 'abc123yourkeyhere',
```

### Step 4 — Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**: select `Deploy from a branch`
4. Branch: `main` / folder: `/ (root)`
5. Click **Save**
6. Wait ~60 seconds, then visit `https://[yourname].github.io/dashboard`

### Step 5 — Add to iPhone Home Screen

1. Open the URL in **Safari** on your iPhone (must be Safari, not Chrome)
2. Tap the **Share** button (box with arrow pointing up)
3. Scroll down and tap **Add to Home Screen**
4. Name it "Dashboard" and tap **Add**
5. Open the app from your Home Screen — it launches fullscreen with no browser chrome

---

## Configuration

All settings are in `js/config.js`. Edit this file for routine maintenance.

| Setting | Default | Description |
|---------|---------|-------------|
| `weather.apiKey` | `'YOUR_KEY'` | OpenWeatherMap API key |
| `weather.refreshMs` | `30 * 60 * 1000` | Weather refresh interval |
| `weather.fallback` | Mumbai | Coordinates if geolocation denied |
| `ambient.timeoutMs` | `10 * 1000` | Seconds before returning to ambient |
| `clock.default24h` | `false` | `true` for 24-hour format by default |

---

## Adding a new widget

1. Create `js/widgets/yourwidget.js` using this template:

```js
const YourWidget = {
  CACHE_KEY: 'dash_yourwidget_cache',

  init() {
    this.render();
    setInterval(() => this.render(), 30 * 60 * 1000);
  },

  async render() {
    const el = document.getElementById('widget-your-id');
    if (!el) return;
    try {
      // fetch data, update el.innerHTML
    } catch (err) {
      // show cached or error state
    }
  },
};
```

2. Add a `<div id="widget-your-id" class="widget">` in `index.html` inside `.panel-right`

3. Add a `<script src="js/widgets/yourwidget.js">` before `app.js` in `index.html`

4. Call `YourWidget.init();` in `js/app.js`

5. Add styles in `css/widgets.css` under a clearly labelled section

---

## Deploying updates

```bash
git add .
git commit -m "describe your change"
git push
```

GitHub Pages rebuilds automatically. Live in ~30 seconds.

---

## Planned future widgets

- Google Calendar — next meeting and daily agenda
- IEX India — DAM / GDAM electricity prices (15-minute refresh)
- Productivity — daily task summary

---

## Tech stack

| Layer | Choice | Reason |
|-------|--------|--------|
| JavaScript | Vanilla ES6+ | Zero overhead on iPhone 6 A8 chip |
| CSS | Vanilla + custom properties | No build step, iOS 12 compatible |
| Hosting | GitHub Pages | Free HTTPS, auto-deploy on push |
| Weather | OpenWeatherMap free tier | Weather + AQI from one key |
| Font | `-apple-system` | SF Pro on iPhone — no network request |
| Storage | localStorage | Theme, format pref, weather cache |
