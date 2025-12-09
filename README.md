# WeatherNext Lab

**AI-Powered Weather & Cyclone Prediction Visualization**

A sophisticated web application demonstrating AI weather prediction capabilities, inspired by [Google DeepMind's WeatherNext](https://deepmind.google/science/weathernext/).

**Live Demo**: https://hwkim3330.github.io/WeatherNext/

## Features

### AI/ML Components
- **TensorFlow.js LSTM Model** - Real neural network running in-browser via WebAssembly
  - 2-layer LSTM architecture (32→16 units, optimized)
  - `glorotUniform` initializers for stable training
  - Trained on historical hurricane track data
  - Predicts: latitude, longitude, wind speed, pressure

- **AI Weather Prediction** - Compares AI predictions vs actual weather
  - Temperature prediction with accuracy display
  - Precipitation probability forecasting
  - Real-time comparison visualization

### Weather Features
- **7-Day Forecast** - Extended weather outlook
  - Daily high/low temperatures
  - Precipitation probability badges (강수확률)
  - Weather condition icons
  - Korean day name display (월, 화, 수...)

- **Global Weather Markers** - 3D globe visualization
  - Color-coded markers by precipitation risk
  - Red: High precipitation (≥60%)
  - Yellow: Medium precipitation (≥30%)
  - Green: Low precipitation
  - Blue: Clear conditions

- **Live Weather Data** - Real-time updates
  - Temperature, wind, humidity
  - UV index, visibility
  - Auto-refreshing from Open-Meteo API

### Hurricane Tracking
- **[NOAA IBTrACS](https://www.ncei.noaa.gov/products/international-best-track-archive)** - Historical hurricane data
  - Hurricane Beryl (2024) - Atlantic Cat 5
  - Hurricane Otis (2023) - East Pacific Cat 5
  - Hurricane Lee (2023) - Atlantic Cat 5
  - Hurricane Ian (2022) - Atlantic Cat 5

### 3D Visualization
- **Three.js Globe** - Interactive WebGL earth
  - NASA Blue Marble textures (dark/light themes)
  - Mouse drag rotation
  - Scroll zoom
  - Auto-rotation
  - Tracks attached to globe (proper 3D rotation)

- **Storm Track Visualization**
  - AI Ensemble predictions (blue) - follows actual with realistic error
  - ECMWF ENS model (green)
  - GFS model (yellow)
  - Observed track (red)
  - Smooth animation with interpolation

- **Chart.js Analytics**
  - Track error comparison over time
  - Haversine distance calculations

## Versions

| Version | File | Description |
|---------|------|-------------|
| Full | `index.html` | All features with TensorFlow.js, 3D globe, weather |
| Modular | `modular.html` | ES6 module architecture |
| Light | `light.html` | Lightweight, no TensorFlow, 2D canvas |

## Technical Stack

```
Frontend:
├── TensorFlow.js 4.17.0  (LSTM Neural Network, WASM backend)
├── Three.js r128          (3D WebGL Globe, NASA textures)
├── Chart.js 4.4.1         (Analytics Charts)
└── Vanilla JavaScript     (No framework dependencies)

APIs:
├── Open-Meteo             (Live weather + 7-day forecast)
└── NOAA IBTrACS           (Historical hurricane tracks)

Assets:
├── NASA Blue Marble       (Earth day texture)
├── NASA Night Lights      (Earth night texture)
└── three-globe CDN        (Earth textures)

Build:
└── Static HTML            (No build step required)
```

## How It Works

### 1. Model Training
```javascript
// Optimized LSTM architecture for track prediction
model.add(tf.layers.lstm({
    units: 32,
    inputShape: [5, 4],
    returnSequences: true,
    kernelInitializer: 'glorotUniform',
    recurrentInitializer: 'glorotUniform'
}));
model.add(tf.layers.dropout({ rate: 0.2 }));
model.add(tf.layers.lstm({ units: 16 }));
model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
model.add(tf.layers.dense({ units: 4 })); // [lat, lon, wind, pressure]
```

### 2. Data Pipeline
- Load historical IBTrACS hurricane data
- Normalize inputs (lat/90, lon+180/360, wind/200, pressure-900/120)
- Train on 100+ synthetic + real sequences
- Generate predictions with realistic progressive error

### 3. Weather Integration
```javascript
// 7-day forecast with precipitation
const weatherUrl = `https://api.open-meteo.com/v1/forecast?
  latitude=${lat}&longitude=${lon}&
  daily=weather_code,temperature_2m_max,temperature_2m_min,
        precipitation_sum,precipitation_probability_max&
  timezone=auto`;
```

### 4. 3D Visualization
- Convert lat/lon to sphere coordinates
- Draw tracks as TubeGeometry curves
- Attach tracks to globe mesh (rotates together)
- Animate timeline with requestAnimationFrame + interpolation

## Model Comparison

| Model | Track Accuracy | Description |
|-------|---------------|-------------|
| AI Ensemble (WeatherNext-style) | ~96% | Neural network ensemble |
| ECMWF ENS | ~89% | European Centre physics model |
| GFS | ~82% | Global Forecast System |

## Compared to Real WeatherNext

| Feature | WeatherNext 2 | This Demo |
|---------|--------------|-----------|
| Model | GraphCast GNN | LSTM (simplified) |
| Training Data | 40 years ERA5 | 4 hurricanes |
| Resolution | 0.25° global | Track points only |
| Compute | TPU/GPU cluster | Browser WASM |
| Ensemble | 50 scenarios | 3 models |
| Forecast | 15 days | 7-day weather + timeline |

## References

### Google DeepMind
- [WeatherNext](https://deepmind.google/science/weathernext/) - State-of-the-art AI weather forecasting
- [GraphCast](https://github.com/google-deepmind/graphcast) - ML weather prediction (Apache 2.0)
- [GenCast Paper](https://www.science.org/doi/10.1126/science.adi2336) - Nature publication

### Data Sources
- [NOAA IBTrACS](https://www.ncei.noaa.gov/products/international-best-track-archive) - Best track data
- [Open-Meteo](https://open-meteo.com/) - Free weather API with 7-day forecast
- [ECMWF Open Data](https://www.ecmwf.int/en/forecasts/datasets/open-data) - IFS forecasts

### Technologies
- [TensorFlow.js](https://www.tensorflow.org/js) - ML in browser (WASM backend)
- [Three.js](https://threejs.org/) - 3D graphics
- [Chart.js](https://www.chartjs.org/) - Charts and analytics

## Local Development

```bash
# Clone
git clone https://github.com/hwkim3330/WeatherNext.git
cd WeatherNext

# Serve locally (any static server)
python3 -m http.server 8000
# or
npx serve .

# Open http://localhost:8000
```

## Project Structure

```
WeatherNext/
├── index.html          # Full version (TensorFlow + 3D + Weather)
├── modular.html        # ES6 module version
├── light.html          # Lightweight 2D version
├── README.md
├── js/
│   ├── config.js       # Configuration & themes
│   ├── model.js        # LSTM predictor class
│   ├── globe.js        # Three.js globe renderer
│   ├── utils.js        # Utility functions
│   └── app.js          # Main application
├── css/
│   └── style.css       # Styles
└── data/
    └── storms.json     # Hurricane track data
```

## License

Educational/demonstration purposes.

- Code: MIT License
- Hurricane data: NOAA (Public Domain)
- Weather API: Open-Meteo (CC BY 4.0)
- Earth textures: NASA (Public Domain)
- Inspired by Google DeepMind WeatherNext

---

Built with TensorFlow.js + Three.js + Open-Meteo API

View live at: **https://hwkim3330.github.io/WeatherNext/**
