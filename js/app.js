// WeatherNext Main Application
import { CONFIG, THEMES } from './config.js';
import { CyclonePredictor } from './model.js';
import { GlobeRenderer } from './globe.js';
import { haversine, getWeatherIcon, formatDate, $, $$ } from './utils.js';

class WeatherNextApp {
    constructor() {
        this.storms = [];
        this.cities = [];
        this.currentStorm = 0;
        this.currentStep = 100;
        this.isPlaying = false;
        this.activeModel = 'ai';
        this.isDark = true;

        this.predictor = null;
        this.globe = null;
        this.chart = null;
    }

    async init() {
        try {
            this.setProgress('Loading data...', 5);

            // Load storm data
            const data = await this.loadStormData();
            this.storms = data.storms;
            this.cities = data.cities;

            // Initialize predictor
            this.predictor = new CyclonePredictor();
            await this.predictor.init((msg, pct) => this.setProgress(msg, pct));

            // Train model
            await this.predictor.train(this.storms, (msg, pct) => this.setProgress(msg, pct));

            // Generate predictions
            this.setProgress('Generating predictions...', 70);
            await this.generateAllPredictions();

            // Initialize globe
            this.setProgress('Creating 3D globe...', 80);
            this.globe = new GlobeRenderer('globe-container');
            this.globe.init();

            // Setup UI
            this.setProgress('Setting up interface...', 90);
            this.populateStormList();
            this.initChart();
            this.setupEvents();

            // Fetch weather
            this.setProgress('Fetching weather...', 95);
            await this.fetchWeather();

            // Initial render
            this.updateVisualization();

            // Done
            this.setProgress('Ready!', 100);
            setTimeout(() => $('#loading').classList.add('hidden'), 500);

        } catch (error) {
            console.error('Initialization error:', error);
            this.setProgress(`Error: ${error.message}`, 0);
        }
    }

    async loadStormData() {
        try {
            const res = await fetch('data/storms.json');
            return await res.json();
        } catch {
            // Fallback to inline data
            return this.getInlineData();
        }
    }

    getInlineData() {
        // Inline fallback data
        return {
            storms: [
                {
                    id: 'beryl2024',
                    name: 'Hurricane Beryl',
                    category: 'Category 5',
                    dates: 'Jun 28 - Jul 11, 2024',
                    basin: 'Atlantic',
                    track: [
                        { lon: -45.4, lat: 9.4, wind: 45, pressure: 1003, time: '2024-06-28T12:00Z' },
                        { lon: -48.2, lat: 10.1, wind: 60, pressure: 996, time: '2024-06-29T00:00Z' },
                        { lon: -51.1, lat: 10.6, wind: 85, pressure: 980, time: '2024-06-29T12:00Z' },
                        { lon: -54.0, lat: 10.9, wind: 115, pressure: 959, time: '2024-06-30T00:00Z' },
                        { lon: -57.0, lat: 11.1, wind: 130, pressure: 946, time: '2024-06-30T12:00Z' },
                        { lon: -59.9, lat: 11.3, wind: 140, pressure: 938, time: '2024-07-01T00:00Z' },
                        { lon: -62.7, lat: 11.9, wind: 150, pressure: 934, time: '2024-07-01T12:00Z' },
                        { lon: -65.6, lat: 12.6, wind: 145, pressure: 938, time: '2024-07-02T00:00Z' },
                        { lon: -68.6, lat: 13.5, wind: 130, pressure: 950, time: '2024-07-02T12:00Z' },
                        { lon: -71.6, lat: 14.3, wind: 120, pressure: 960, time: '2024-07-03T00:00Z' },
                        { lon: -74.6, lat: 15.2, wind: 100, pressure: 972, time: '2024-07-03T12:00Z' },
                        { lon: -77.5, lat: 16.0, wind: 85, pressure: 980, time: '2024-07-04T00:00Z' },
                        { lon: -80.2, lat: 16.8, wind: 90, pressure: 978, time: '2024-07-04T12:00Z' },
                        { lon: -82.8, lat: 17.5, wind: 95, pressure: 974, time: '2024-07-05T00:00Z' },
                        { lon: -85.1, lat: 18.1, wind: 110, pressure: 965, time: '2024-07-05T12:00Z' },
                        { lon: -87.3, lat: 18.7, wind: 95, pressure: 973, time: '2024-07-06T00:00Z' },
                        { lon: -89.5, lat: 19.4, wind: 80, pressure: 982, time: '2024-07-06T12:00Z' },
                        { lon: -91.8, lat: 20.2, wind: 70, pressure: 988, time: '2024-07-07T00:00Z' },
                        { lon: -94.2, lat: 21.4, wind: 75, pressure: 985, time: '2024-07-07T12:00Z' },
                        { lon: -96.4, lat: 23.1, wind: 80, pressure: 980, time: '2024-07-08T00:00Z' }
                    ]
                },
                {
                    id: 'otis2023',
                    name: 'Hurricane Otis',
                    category: 'Category 5',
                    dates: 'Oct 22-25, 2023',
                    basin: 'East Pacific',
                    track: [
                        { lon: -96.3, lat: 11.4, wind: 35, pressure: 1004, time: '2023-10-22T12:00Z' },
                        { lon: -96.8, lat: 12.4, wind: 45, pressure: 1000, time: '2023-10-23T00:00Z' },
                        { lon: -97.3, lat: 13.5, wind: 65, pressure: 991, time: '2023-10-23T12:00Z' },
                        { lon: -97.8, lat: 14.6, wind: 100, pressure: 968, time: '2023-10-24T00:00Z' },
                        { lon: -98.2, lat: 15.5, wind: 140, pressure: 937, time: '2023-10-24T12:00Z' },
                        { lon: -99.0, lat: 16.5, wind: 165, pressure: 923, time: '2023-10-25T00:00Z' },
                        { lon: -99.5, lat: 17.2, wind: 135, pressure: 945, time: '2023-10-25T06:00Z' }
                    ]
                },
                {
                    id: 'lee2023',
                    name: 'Hurricane Lee',
                    category: 'Category 5',
                    dates: 'Sep 5-16, 2023',
                    basin: 'Atlantic',
                    track: [
                        { lon: -35.0, lat: 11.5, wind: 40, pressure: 1005, time: '2023-09-05T12:00Z' },
                        { lon: -38.5, lat: 12.0, wind: 70, pressure: 988, time: '2023-09-06T12:00Z' },
                        { lon: -42.0, lat: 13.0, wind: 105, pressure: 963, time: '2023-09-07T12:00Z' },
                        { lon: -46.0, lat: 14.5, wind: 145, pressure: 935, time: '2023-09-08T12:00Z' },
                        { lon: -50.5, lat: 16.0, wind: 160, pressure: 926, time: '2023-09-09T12:00Z' },
                        { lon: -55.0, lat: 17.5, wind: 140, pressure: 940, time: '2023-09-10T12:00Z' },
                        { lon: -59.0, lat: 19.0, wind: 130, pressure: 948, time: '2023-09-11T12:00Z' },
                        { lon: -62.5, lat: 21.0, wind: 115, pressure: 958, time: '2023-09-12T12:00Z' },
                        { lon: -65.5, lat: 24.0, wind: 100, pressure: 968, time: '2023-09-13T12:00Z' },
                        { lon: -67.5, lat: 30.0, wind: 85, pressure: 975, time: '2023-09-14T12:00Z' },
                        { lon: -68.0, lat: 37.0, wind: 75, pressure: 982, time: '2023-09-15T12:00Z' },
                        { lon: -67.0, lat: 44.0, wind: 65, pressure: 988, time: '2023-09-16T12:00Z' }
                    ]
                },
                {
                    id: 'ian2022',
                    name: 'Hurricane Ian',
                    category: 'Category 5',
                    dates: 'Sep 23 - Oct 2, 2022',
                    basin: 'Atlantic',
                    track: [
                        { lon: -74.0, lat: 14.0, wind: 30, pressure: 1006, time: '2022-09-23T12:00Z' },
                        { lon: -76.5, lat: 15.0, wind: 50, pressure: 998, time: '2022-09-24T12:00Z' },
                        { lon: -79.5, lat: 16.5, wind: 75, pressure: 985, time: '2022-09-25T12:00Z' },
                        { lon: -82.0, lat: 18.0, wind: 105, pressure: 963, time: '2022-09-26T12:00Z' },
                        { lon: -83.5, lat: 20.0, wind: 130, pressure: 947, time: '2022-09-27T12:00Z' },
                        { lon: -83.0, lat: 23.0, wind: 155, pressure: 937, time: '2022-09-28T06:00Z' },
                        { lon: -82.5, lat: 26.5, wind: 150, pressure: 940, time: '2022-09-28T18:00Z' },
                        { lon: -81.0, lat: 30.0, wind: 85, pressure: 975, time: '2022-09-29T18:00Z' },
                        { lon: -79.5, lat: 33.0, wind: 70, pressure: 983, time: '2022-09-30T12:00Z' }
                    ]
                }
            ],
            cities: [
                { name: 'Miami', country: 'USA', lat: 25.76, lon: -80.19 },
                { name: 'Tokyo', country: 'Japan', lat: 35.68, lon: 139.65 },
                { name: 'Seoul', country: 'Korea', lat: 37.57, lon: 126.98 },
                { name: 'Manila', country: 'Philippines', lat: 14.60, lon: 120.98 },
                { name: 'Hong Kong', country: 'China', lat: 22.32, lon: 114.17 },
                { name: 'Sydney', country: 'Australia', lat: -33.87, lon: 151.21 }
            ]
        };
    }

    async generateAllPredictions() {
        for (const storm of this.storms) {
            storm.aiPred = await this.predictor.predict(storm.track, storm.track.length);
            const { ecmwf, gfs } = this.predictor.generateComparison(storm.track);
            storm.ecmwfPred = ecmwf;
            storm.gfsPred = gfs;
        }
    }

    populateStormList() {
        const list = $('#stormList');
        list.innerHTML = '';

        this.storms.forEach((storm, i) => {
            const item = document.createElement('div');
            item.className = `storm-item ${i === this.currentStorm ? 'active' : ''}`;
            item.innerHTML = `
                <div class="storm-item-icon">🌀</div>
                <div class="storm-item-info">
                    <div class="storm-item-name">${storm.name}</div>
                    <div class="storm-item-meta">${storm.dates} · ${storm.basin}</div>
                </div>
            `;
            item.onclick = () => this.selectStorm(i);
            list.appendChild(item);
        });
    }

    selectStorm(index) {
        this.currentStorm = index;
        this.currentStep = 100;
        $('#timelineSlider').value = 100;

        $$('.storm-item').forEach((el, i) => {
            el.classList.toggle('active', i === index);
        });

        this.updateVisualization();
        this.updateChart();
    }

    initChart() {
        const ctx = $('#errorChart').getContext('2d');
        const textColor = this.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
        const gridColor = this.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    { label: 'AI Ensemble', data: [], borderColor: CONFIG.COLORS.AI, backgroundColor: 'rgba(66,133,244,0.1)', fill: true, tension: 0.4 },
                    { label: 'ECMWF', data: [], borderColor: CONFIG.COLORS.ECMWF, backgroundColor: 'rgba(52,168,83,0.1)', fill: true, tension: 0.4 },
                    { label: 'GFS', data: [], borderColor: CONFIG.COLORS.GFS, backgroundColor: 'rgba(251,188,4,0.1)', fill: true, tension: 0.4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: textColor } } },
                scales: {
                    x: { grid: { color: gridColor }, ticks: { color: textColor }, title: { display: true, text: 'Forecast Hour', color: textColor } },
                    y: { grid: { color: gridColor }, ticks: { color: textColor }, title: { display: true, text: 'Track Error (km)', color: textColor } }
                }
            }
        });
        this.updateChart();
    }

    updateChart() {
        const storm = this.storms[this.currentStorm];
        const labels = [], aiErr = [], ecErr = [], gfsErr = [];

        for (let i = 0; i < storm.track.length; i++) {
            labels.push(i * 12 + 'h');
            const actual = storm.track[i];
            const ai = storm.aiPred?.[i] || actual;
            const ec = storm.ecmwfPred?.[i] || actual;
            const gfs = storm.gfsPred?.[i] || actual;

            aiErr.push(haversine(actual.lat, actual.lon, ai.lat, ai.lon));
            ecErr.push(haversine(actual.lat, actual.lon, ec.lat, ec.lon));
            gfsErr.push(haversine(actual.lat, actual.lon, gfs.lat, gfs.lon));
        }

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = aiErr;
        this.chart.data.datasets[1].data = ecErr;
        this.chart.data.datasets[2].data = gfsErr;
        this.chart.update();
    }

    setupEvents() {
        // Model tabs
        $$('.model-tab').forEach(tab => {
            tab.onclick = () => {
                $$('.model-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.activeModel = tab.dataset.model;
                this.updateVisualization();
            };
        });

        // Timeline
        const slider = $('#timelineSlider');
        slider.oninput = () => {
            this.currentStep = parseInt(slider.value);
            this.updateVisualization();
        };

        // Play/Pause
        $('#btnPlay').onclick = () => {
            this.isPlaying = !this.isPlaying;
            $('#btnPlay').textContent = this.isPlaying ? '⏸' : '▶';
            $('#btnPlay').classList.toggle('active', this.isPlaying);
        };

        $('#btnPrev').onclick = () => {
            this.currentStep = Math.max(0, this.currentStep - 5);
            slider.value = this.currentStep;
            this.updateVisualization();
        };

        $('#btnNext').onclick = () => {
            this.currentStep = Math.min(100, this.currentStep + 5);
            slider.value = this.currentStep;
            this.updateVisualization();
        };

        // Theme toggle
        $('#themeToggle').onclick = () => this.toggleTheme();

        // Animation loop
        setInterval(() => {
            if (this.isPlaying) {
                this.currentStep = this.currentStep >= 100 ? 0 : this.currentStep + CONFIG.ANIMATION.TIMELINE_STEP;
                slider.value = this.currentStep;
                this.updateVisualization();
            }
        }, CONFIG.ANIMATION.TIMELINE_INTERVAL);
    }

    toggleTheme() {
        this.isDark = !this.isDark;
        document.body.setAttribute('data-theme', this.isDark ? '' : 'light');
        $('#themeToggle').textContent = this.isDark ? '🌙' : '☀️';

        // Update globe
        this.globe?.setTheme(this.isDark);

        // Update chart
        if (this.chart) {
            const textColor = this.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
            const gridColor = this.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
            this.chart.options.plugins.legend.labels.color = textColor;
            ['x', 'y'].forEach(axis => {
                this.chart.options.scales[axis].grid.color = gridColor;
                this.chart.options.scales[axis].ticks.color = textColor;
                this.chart.options.scales[axis].title.color = textColor;
            });
            this.chart.update();
        }
    }

    updateVisualization() {
        const storm = this.storms[this.currentStorm];
        const maxIdx = Math.floor(this.currentStep / 100 * (storm.track.length - 1));

        // Update globe
        this.globe?.updateTracks(storm, maxIdx, this.activeModel);

        // Update info panel
        this.updateStormInfo(storm, maxIdx);
    }

    updateStormInfo(storm, idx) {
        const pt = storm.track[Math.min(idx, storm.track.length - 1)];

        $('#stormName').textContent = storm.name;
        $('#stormCat').textContent = storm.category;
        $('#statWind').textContent = pt.wind;
        $('#statPressure').textContent = pt.pressure;
        $('#statLat').textContent = pt.lat.toFixed(1) + '°N';
        $('#statLon').textContent = Math.abs(pt.lon).toFixed(1) + '°W';

        if (pt.time) {
            $('#timelineDate').textContent = formatDate(pt.time);
        }
    }

    async fetchWeather() {
        const grid = $('#weatherGrid');
        grid.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted)">Loading weather...</div>';

        for (const city of this.cities) {
            try {
                const res = await fetch(`${CONFIG.OPEN_METEO_API}?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`);
                const data = await res.json();

                if (grid.innerHTML.includes('Loading')) grid.innerHTML = '';

                const icon = getWeatherIcon(data.current.weather_code);
                const card = document.createElement('div');
                card.className = 'weather-card';
                card.innerHTML = `
                    <div class="weather-header">
                        <div>
                            <div class="weather-location">${city.name}</div>
                            <div class="weather-country">${city.country}</div>
                        </div>
                        <div class="weather-icon">${icon}</div>
                    </div>
                    <div class="weather-temp">${Math.round(data.current.temperature_2m)}°C</div>
                    <div class="weather-details">
                        <span>💨 ${data.current.wind_speed_10m} km/h</span>
                        <span>💧 ${data.current.relative_humidity_2m}%</span>
                    </div>
                `;
                grid.appendChild(card);
            } catch (e) {
                console.error('Weather fetch failed:', city.name, e);
            }
        }
    }

    setProgress(text, pct) {
        const loadingText = $('#loadingText');
        const progressBar = $('#progressBar');
        if (loadingText) loadingText.textContent = text;
        if (progressBar) progressBar.style.width = pct + '%';
    }
}

// Initialize
const app = new WeatherNextApp();
app.init();

// Export for global access
window.weatherApp = app;
window.refreshWeather = () => app.fetchWeather();
