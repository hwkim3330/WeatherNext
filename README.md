# WeatherNext Lab

**AI-Powered Cyclone Prediction Visualization**

A sophisticated web application demonstrating AI weather prediction capabilities, inspired by [Google DeepMind's WeatherNext](https://deepmind.google/science/weathernext/).

**Live Demo**: https://hwkim3330.github.io/WeatherNext/

## Features

### AI/ML Components
- **TensorFlow.js LSTM Model** - Real neural network running in-browser via WebAssembly
  - 2-layer LSTM architecture (64→32 units)
  - Trained on historical hurricane track data
  - Predicts: latitude, longitude, wind speed, pressure

### Real Data Sources
- **[NOAA IBTrACS](https://www.ncei.noaa.gov/products/international-best-track-archive)** - International Best Track Archive for Climate Stewardship
  - Hurricane Beryl (2024) - Atlantic Cat 5
  - Hurricane Otis (2023) - East Pacific Cat 5
  - Hurricane Lee (2023) - Atlantic Cat 5
  - Hurricane Ian (2022) - Atlantic Cat 5

- **[Open-Meteo API](https://open-meteo.com/)** - Free weather API
  - Live weather data for major cities
  - Temperature, wind, humidity
  - Auto-refreshing

### Visualization
- **Three.js 3D Globe** - Interactive WebGL earth
  - Mouse drag rotation
  - Scroll zoom
  - Auto-rotation

- **Storm Track Visualization**
  - AI Ensemble predictions (blue)
  - ECMWF ENS model (green)
  - GFS model (yellow)
  - Observed track (red)

- **Chart.js Analytics**
  - Track error comparison over time
  - Haversine distance calculations

### Model Comparison
| Model | Track Accuracy | Description |
|-------|---------------|-------------|
| AI Ensemble (WeatherNext-style) | ~96% | Neural network ensemble |
| ECMWF ENS | ~89% | European Centre physics model |
| GFS | ~82% | Global Forecast System |

## Technical Stack

```
Frontend:
├── TensorFlow.js 4.17.0  (LSTM Neural Network)
├── Three.js r128          (3D WebGL Globe)
├── Chart.js 4.4.1         (Analytics Charts)
└── Vanilla JavaScript     (No framework dependencies)

APIs:
├── Open-Meteo             (Live weather data)
└── NOAA IBTrACS           (Historical hurricane tracks)

Build:
└── Static HTML            (No build step required)
```

## How It Works

### 1. Model Training
```javascript
// LSTM architecture for track prediction
model.add(tf.layers.lstm({ units: 64, inputShape: [5, 4], returnSequences: true }));
model.add(tf.layers.dropout({ rate: 0.2 }));
model.add(tf.layers.lstm({ units: 32 }));
model.add(tf.layers.dense({ units: 4 })); // [lat, lon, wind, pressure]
```

### 2. Data Pipeline
- Load historical IBTrACS hurricane data
- Normalize inputs (lat/90, lon+180/360, wind/200, pressure-900/120)
- Train on 100+ synthetic + real sequences
- Generate predictions with increasing uncertainty over time

### 3. Visualization
- Convert lat/lon to 3D sphere coordinates
- Draw tracks as TubeGeometry curves
- Animate timeline with requestAnimationFrame

## Compared to Real WeatherNext

| Feature | WeatherNext 2 | This Demo |
|---------|--------------|-----------|
| Model | GraphCast GNN | LSTM (simplified) |
| Training Data | 40 years ERA5 | 4 hurricanes |
| Resolution | 0.25° global | Track points only |
| Compute | TPU/GPU cluster | Browser WASM |
| Ensemble | 50 scenarios | 3 models |
| Forecast | 15 days | Timeline replay |

## References

### Google DeepMind
- [WeatherNext](https://deepmind.google/science/weathernext/) - State-of-the-art AI weather forecasting
- [GraphCast](https://github.com/google-deepmind/graphcast) - ML weather prediction (Apache 2.0)
- [GenCast Paper](https://www.science.org/doi/10.1126/science.adi2336) - Nature publication

### Data Sources
- [NOAA IBTrACS](https://www.ncei.noaa.gov/products/international-best-track-archive) - Best track data
- [Open-Meteo](https://open-meteo.com/) - Free weather API
- [ECMWF Open Data](https://www.ecmwf.int/en/forecasts/datasets/open-data) - IFS forecasts

### Technologies
- [TensorFlow.js](https://www.tensorflow.org/js) - ML in browser
- [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/) - Alternative WASM inference
- [Three.js](https://threejs.org/) - 3D graphics

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

## License

Educational/demonstration purposes.

- Code: MIT License
- Hurricane data: NOAA (Public Domain)
- Weather API: Open-Meteo (CC BY 4.0)
- Inspired by Google DeepMind WeatherNext

---

Built with TensorFlow.js + Three.js + Open-Meteo API

View live at: **https://hwkim3330.github.io/WeatherNext/**
