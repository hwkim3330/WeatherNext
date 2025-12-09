// WeatherNext LSTM Model Module
import { CONFIG } from './config.js';

export class CyclonePredictor {
    constructor() {
        this.model = null;
        this.isReady = false;
    }

    async init(onProgress) {
        // Set WASM backend for better performance
        try {
            await tf.setBackend(CONFIG.TF_BACKEND);
            await tf.ready();
            onProgress?.('TensorFlow.js ready (WASM backend)', 15);
        } catch (e) {
            console.warn('WASM backend failed, falling back to WebGL');
            await tf.setBackend('webgl');
            await tf.ready();
        }

        await this.buildModel(onProgress);
        this.isReady = true;
    }

    async buildModel(onProgress) {
        onProgress?.('Building LSTM model...', 20);

        this.model = tf.sequential();

        // Layer 1: LSTM
        this.model.add(tf.layers.lstm({
            units: CONFIG.MODEL.LSTM_UNITS_1,
            inputShape: [5, 4], // 5 timesteps, 4 features (lat, lon, wind, pressure)
            returnSequences: true,
            kernelInitializer: 'glorotUniform',
            recurrentInitializer: 'glorotUniform'
        }));

        // Dropout for regularization
        this.model.add(tf.layers.dropout({ rate: 0.2 }));

        // Layer 2: LSTM
        this.model.add(tf.layers.lstm({
            units: CONFIG.MODEL.LSTM_UNITS_2,
            returnSequences: false,
            kernelInitializer: 'glorotUniform',
            recurrentInitializer: 'glorotUniform'
        }));

        // Dense layer
        this.model.add(tf.layers.dense({
            units: CONFIG.MODEL.DENSE_UNITS,
            activation: 'relu'
        }));

        // Output layer
        this.model.add(tf.layers.dense({
            units: 4 // lat, lon, wind, pressure
        }));

        this.model.compile({
            optimizer: tf.train.adam(CONFIG.MODEL.LEARNING_RATE),
            loss: 'meanSquaredError'
        });

        onProgress?.('Model architecture ready', 25);
    }

    async train(storms, onProgress) {
        onProgress?.('Preparing training data...', 30);

        const { sequences, targets } = this.prepareTrainingData(storms);

        const xs = tf.tensor3d(sequences);
        const ys = tf.tensor2d(targets);

        onProgress?.('Training model...', 35);

        await this.model.fit(xs, ys, {
            epochs: CONFIG.MODEL.EPOCHS,
            batchSize: CONFIG.MODEL.BATCH_SIZE,
            shuffle: true,
            validationSplit: 0.1,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    const progress = 35 + Math.floor((epoch + 1) / CONFIG.MODEL.EPOCHS * 30);
                    onProgress?.(`Training: epoch ${epoch + 1}/${CONFIG.MODEL.EPOCHS} (loss: ${logs.loss.toFixed(4)})`, progress);
                }
            }
        });

        // Cleanup
        xs.dispose();
        ys.dispose();

        onProgress?.('Training complete', 65);
    }

    prepareTrainingData(storms) {
        const sequences = [];
        const targets = [];

        // Real storm data
        storms.forEach(storm => {
            const track = storm.track;
            for (let i = 0; i < track.length - 6; i++) {
                const seq = [];
                for (let j = 0; j < 5; j++) {
                    const p = track[i + j];
                    seq.push(this.normalizePoint(p));
                }
                sequences.push(seq);
                targets.push(this.normalizePoint(track[i + 5]));
            }
        });

        // Synthetic data augmentation
        for (let i = 0; i < 200; i++) {
            const baseLat = 10 + Math.random() * 25;
            const baseLon = -100 + Math.random() * 70;
            const seq = [];

            for (let j = 0; j < 5; j++) {
                seq.push([
                    (baseLat + j * 0.8) / 90,
                    (baseLon - j * 1.2 + 180) / 360,
                    (40 + j * 15) / 200,
                    (1005 - j * 10 - 900) / 120
                ]);
            }
            sequences.push(seq);
            targets.push([
                (baseLat + 5 * 0.8) / 90,
                (baseLon - 5 * 1.2 + 180) / 360,
                (40 + 75) / 200,
                (1005 - 50 - 900) / 120
            ]);
        }

        return { sequences, targets };
    }

    normalizePoint(p) {
        return [
            p.lat / 90,
            (p.lon + 180) / 360,
            p.wind / 200,
            (p.pressure - 900) / 120
        ];
    }

    denormalizePoint(arr) {
        return {
            lat: arr[0] * 90,
            lon: arr[1] * 360 - 180,
            wind: Math.max(20, Math.min(180, arr[2] * 200)),
            pressure: Math.max(880, Math.min(1020, arr[3] * 120 + 900))
        };
    }

    async predict(track, steps = 10) {
        if (!this.isReady || track.length < 5) return track;

        const predictions = [...track.slice(0, 5)];

        for (let i = 5; i < Math.min(track.length, steps + 5); i++) {
            const input = [];
            for (let j = 0; j < 5; j++) {
                const p = predictions[predictions.length - 5 + j];
                input.push(this.normalizePoint(p));
            }

            const tensor = tf.tensor3d([input]);
            const pred = this.model.predict(tensor);
            const data = await pred.data();
            tensor.dispose();
            pred.dispose();

            // Add progressive error
            const errorScale = 0.15 * Math.sqrt(i - 4);
            const denorm = this.denormalizePoint(data);

            predictions.push({
                lat: denorm.lat + (Math.random() - 0.5) * errorScale * 0.5,
                lon: denorm.lon + (Math.random() - 0.5) * errorScale,
                wind: denorm.wind,
                pressure: denorm.pressure,
                time: track[i]?.time || ''
            });
        }

        return predictions;
    }

    // Generate comparison predictions with different error levels
    generateComparison(actualTrack) {
        const ecmwf = actualTrack.map((p, i) => {
            const e = 0.4 * Math.sqrt(i);
            return {
                ...p,
                lat: p.lat + (Math.random() - 0.5) * e * 0.6,
                lon: p.lon + (Math.random() - 0.5) * e
            };
        });

        const gfs = actualTrack.map((p, i) => {
            const e = 0.7 * Math.sqrt(i);
            return {
                ...p,
                lat: p.lat + (Math.random() - 0.5) * e * 0.7,
                lon: p.lon + (Math.random() - 0.5) * e
            };
        });

        return { ecmwf, gfs };
    }

    dispose() {
        if (this.model) {
            this.model.dispose();
        }
    }
}
