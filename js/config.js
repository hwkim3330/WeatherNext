// WeatherNext Configuration
export const CONFIG = {
    // API endpoints
    OPEN_METEO_API: 'https://api.open-meteo.com/v1/forecast',

    // TensorFlow.js settings
    TF_BACKEND: 'wasm', // 'webgl', 'wasm', 'cpu'

    // Model settings (reduced units to avoid slow Orthogonal initializer)
    MODEL: {
        LSTM_UNITS_1: 32,
        LSTM_UNITS_2: 16,
        DENSE_UNITS: 8,
        EPOCHS: 15,
        BATCH_SIZE: 32,
        LEARNING_RATE: 0.001
    },

    // Animation settings
    ANIMATION: {
        GLOBE_ROTATION_SPEED: 0.0005,
        TIMELINE_STEP: 2,
        TIMELINE_INTERVAL: 200
    },

    // Colors
    COLORS: {
        AI: '#4285f4',
        ECMWF: '#34a853',
        GFS: '#fbbc04',
        ACTUAL: '#ea4335'
    }
};

// Theme definitions
export const THEMES = {
    dark: {
        bgPrimary: '#0a0a1a',
        bgSecondary: '#12122a',
        bgCard: 'rgba(255,255,255,0.05)',
        border: 'rgba(255,255,255,0.1)',
        textPrimary: '#ffffff',
        textSecondary: 'rgba(255,255,255,0.7)',
        ocean: '#0a1628',
        land: 'rgba(40, 80, 60, 0.9)',
        globeBg: 0x050510
    },
    light: {
        bgPrimary: '#f5f7fa',
        bgSecondary: '#ffffff',
        bgCard: 'rgba(0,0,0,0.03)',
        border: 'rgba(0,0,0,0.1)',
        textPrimary: '#1a1a2e',
        textSecondary: 'rgba(0,0,0,0.7)',
        ocean: '#a8d5e5',
        land: 'rgba(80, 140, 100, 0.9)',
        globeBg: 0xe8f4fc
    }
};
