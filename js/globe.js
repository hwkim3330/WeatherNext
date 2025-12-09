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
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        this.globeCanvas = canvas;
        this.globeCtx = ctx;
        this.drawGlobeTexture();

        const texture = new THREE.CanvasTexture(canvas);
        this.globe = new THREE.Mesh(
            new THREE.SphereGeometry(1, 64, 64),
            new THREE.MeshPhongMaterial({ map: texture, shininess: 10 })
        );
        this.scene.add(this.globe);

        // Initial rotation to show Caribbean/Atlantic region
        this.globe.rotation.y = Math.PI * 0.4;
    }

    drawGlobeTexture() {
        const ctx = this.globeCtx;
        const w = 2048, h = 1024;
        const theme = this.isDark ? THEMES.dark : THEMES.light;

        // Ocean
        ctx.fillStyle = theme.ocean;
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = this.isDark ? 'rgba(100,150,200,0.15)' : 'rgba(0,50,100,0.1)';
        ctx.lineWidth = 1;
        for (let lat = 0; lat <= h; lat += h / 18) {
            ctx.beginPath(); ctx.moveTo(0, lat); ctx.lineTo(w, lat); ctx.stroke();
        }
        for (let lon = 0; lon <= w; lon += w / 36) {
            ctx.beginPath(); ctx.moveTo(lon, 0); ctx.lineTo(lon, h); ctx.stroke();
        }

        // Continents
        ctx.fillStyle = theme.land;
        ctx.strokeStyle = this.isDark ? 'rgba(80,140,100,0.6)' : 'rgba(60,120,80,0.8)';
        ctx.lineWidth = 2;

        // Continent shapes
        const continents = [
            // North America
            [[280, 150], [380, 130], [480, 150], [520, 200], [500, 280], [450, 350], [400, 380], [350, 400], [300, 380], [280, 340], [260, 280], [230, 230], [250, 180], [280, 150]],
            // Central America
            [[350, 400], [380, 420], [390, 450], [370, 480], [340, 470], [350, 400]],
            // South America
            [[380, 480], [420, 470], [450, 500], [470, 550], [460, 620], [430, 700], [380, 720], [350, 680], [340, 600], [350, 530], [380, 480]],
            // Europe
            [[980, 180], [1020, 160], [1080, 170], [1100, 200], [1080, 250], [1020, 280], [980, 270], [960, 230], [980, 180]],
            // Africa
            [[980, 280], [1040, 270], [1100, 300], [1120, 380], [1100, 480], [1050, 550], [1000, 560], [960, 520], [940, 440], [950, 360], [980, 280]],
            // Asia
            [[1100, 120], [1200, 100], [1350, 110], [1450, 150], [1500, 200], [1480, 280], [1400, 320], [1300, 340], [1200, 320], [1150, 280], [1100, 200], [1100, 120]],
            // India
            [[1200, 320], [1250, 340], [1270, 400], [1240, 450], [1200, 430], [1180, 380], [1200, 320]],
            // Southeast Asia
            [[1350, 350], [1400, 360], [1420, 420], [1380, 450], [1340, 420], [1350, 350]],
            // Australia
            [[1450, 500], [1520, 480], [1580, 510], [1600, 570], [1560, 630], [1500, 640], [1450, 600], [1430, 550], [1450, 500]],
            // Japan
            [[1520, 220], [1540, 200], [1560, 220], [1550, 260], [1520, 250], [1520, 220]]
        ];

        continents.forEach(pts => {
            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });
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
        this.drawGlobeTexture();
        this.globe.material.map.needsUpdate = true;
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
