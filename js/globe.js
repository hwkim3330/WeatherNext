// WeatherNext Globe Module (Three.js)
import { CONFIG, THEMES } from './config.js';

export class GlobeRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.globe = null;
        this.tracks = [];
        this.isDark = true;
        this.isDragging = false;
        this.prevMouse = { x: 0, y: 0 };
    }

    init() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(THEMES.dark.globeBg);

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
        this.camera.position.set(0, 0, 2.8);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Globe
        this.createGlobe();

        // Atmosphere
        this.createAtmosphere();

        // Lights
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(5, 3, 5);
        this.scene.add(sun);

        // Events
        this.setupEvents();

        // Start render loop
        this.animate();
    }

    createGlobe() {
        // Earth texture URLs
        this.earthTextures = {
            dark: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg',
            light: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-day.jpg'
        };

        const textureLoader = new THREE.TextureLoader();
        const earthTexture = textureLoader.load(
            this.earthTextures.dark,
            () => console.log('Earth texture loaded'),
            undefined,
            () => this.createFallbackTexture()
        );

        this.globe = new THREE.Mesh(
            new THREE.SphereGeometry(1, 64, 64),
            new THREE.MeshPhongMaterial({ map: earthTexture, shininess: 5 })
        );
        this.scene.add(this.globe);

        // Initial rotation to show Caribbean/Atlantic region
        this.globe.rotation.y = Math.PI * 0.4;
    }

    createFallbackTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#1a4a6e');
        gradient.addColorStop(0.5, '#0a2a4e');
        gradient.addColorStop(1, '#1a4a6e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1024, 512);

        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        for (let i = 0; i < 18; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * 512/18);
            ctx.lineTo(1024, i * 512/18);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        this.globe.material.map = texture;
        this.globe.material.needsUpdate = true;
    }

    createAtmosphere() {
        const atmo = new THREE.Mesh(
            new THREE.SphereGeometry(1.015, 64, 64),
            new THREE.MeshBasicMaterial({
                color: 0x4488ff,
                transparent: true,
                opacity: 0.08,
                side: THREE.BackSide
            })
        );
        this.scene.add(atmo);
    }

    setupEvents() {
        // Resize
        window.addEventListener('resize', () => {
            const w = this.container.clientWidth;
            const h = this.container.clientHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        });

        // Mouse drag
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.prevMouse = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mouseup', () => this.isDragging = false);

        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const dx = e.clientX - this.prevMouse.x;
            const dy = e.clientY - this.prevMouse.y;
            this.globe.rotation.y += dx * 0.005;
            this.globe.rotation.x = Math.max(-1.2, Math.min(1.2, this.globe.rotation.x + dy * 0.005));
            this.prevMouse = { x: e.clientX, y: e.clientY };
        });

        // Wheel zoom
        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.camera.position.z = Math.max(1.5, Math.min(5, this.camera.position.z + e.deltaY * 0.002));
        }, { passive: false });

        // Touch support
        let touchStart = null;
        this.renderer.domElement.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        });

        this.renderer.domElement.addEventListener('touchmove', (e) => {
            if (!touchStart || e.touches.length !== 1) return;
            const dx = e.touches[0].clientX - touchStart.x;
            const dy = e.touches[0].clientY - touchStart.y;
            this.globe.rotation.y += dx * 0.005;
            this.globe.rotation.x = Math.max(-1.2, Math.min(1.2, this.globe.rotation.x + dy * 0.005));
            touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        });
    }

    latLonTo3D(lat, lon, r = 1.01) {
        const phi = (90 - lat) * Math.PI / 180;
        const theta = (lon + 180) * Math.PI / 180;
        return new THREE.Vector3(
            -r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
        );
    }

    drawTrack(points, color, maxIdx) {
        if (!points || points.length < 2 || maxIdx < 1) return;

        const pts = points.slice(0, maxIdx + 1).map(p => this.latLonTo3D(p.lat, p.lon));
        if (pts.length < 2) return;

        // Track line
        const curve = new THREE.CatmullRomCurve3(pts);
        const geom = new THREE.TubeGeometry(curve, pts.length * 8, 0.008, 8, false);
        const mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: 0.9
        });
        const tube = new THREE.Mesh(geom, mat);
        this.globe.add(tube); // Add to globe so it rotates with globe
        this.tracks.push(tube);

        // Current position marker
        const lastPt = pts[pts.length - 1];
        const marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.025, 16, 16),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(color) })
        );
        marker.position.copy(lastPt);
        this.globe.add(marker); // Add to globe
        this.tracks.push(marker);

        // Glow
        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(0.035, 16, 16),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0.4 })
        );
        glow.position.copy(lastPt);
        this.globe.add(glow); // Add to globe
        this.tracks.push(glow);
    }

    clearTracks() {
        this.tracks.forEach(m => {
            this.globe.remove(m); // Remove from globe
            m.geometry?.dispose();
            m.material?.dispose();
        });
        this.tracks = [];
    }

    updateTracks(storm, maxIdx, activeModel) {
        this.clearTracks();

        if (activeModel === 'all' || activeModel === 'ai') {
            this.drawTrack(storm.aiPred, CONFIG.COLORS.AI, maxIdx);
        }
        if (activeModel === 'all' || activeModel === 'ecmwf') {
            this.drawTrack(storm.ecmwfPred, CONFIG.COLORS.ECMWF, maxIdx);
        }
        if (activeModel === 'all' || activeModel === 'gfs') {
            this.drawTrack(storm.gfsPred, CONFIG.COLORS.GFS, maxIdx);
        }
        // Always draw actual
        this.drawTrack(storm.track, CONFIG.COLORS.ACTUAL, maxIdx);
    }

    setTheme(isDark) {
        this.isDark = isDark;
        const theme = isDark ? THEMES.dark : THEMES.light;

        this.scene.background = new THREE.Color(theme.globeBg);

        // Load appropriate Earth texture
        const textureUrl = isDark ? this.earthTextures.dark : this.earthTextures.light;
        const loader = new THREE.TextureLoader();
        loader.load(textureUrl, (texture) => {
            this.globe.material.map = texture;
            this.globe.material.needsUpdate = true;
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.globe && !this.isDragging) {
            this.globe.rotation.y += CONFIG.ANIMATION.GLOBE_ROTATION_SPEED;
        }

        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        this.clearTracks();
        this.renderer.dispose();
    }
}
